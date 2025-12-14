import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { Admission, AdmissionDocument, AdmissionStatus, Gender, Religion, AdmissionBatch } from './schema/admission.schema';

@Injectable()
export class AdmissionService {
  constructor(
    @InjectModel(Admission.name)
    private admissionModel: Model<AdmissionDocument>,
  ) {}

  // Parse and validate date
  private parseDate(dateString: any): Date | undefined {
    if (!dateString) {
      return undefined;
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date format: ${dateString}. Use YYYY-MM-DD`);
    }
    
    return date;
  }

  // Create new admission with client-provided registrationId
  async create(createAdmissionDto: CreateAdmissionDto, userId: string): Promise<AdmissionDocument> {
    try {
      console.log('Raw DTO received:', JSON.stringify(createAdmissionDto, null, 2));

      // Client MUST provide registrationId
      if (!createAdmissionDto.registrationId) {
        throw new BadRequestException('Registration ID is required');
      }

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if registration ID already exists
      const existing = await this.admissionModel.findOne({ 
        registrationId: createAdmissionDto.registrationId.trim()
      });
      
      if (existing) {
        throw new ConflictException('Registration ID already exists');
      }

      // Parse dates
      const studentDateOfBirth = createAdmissionDto.studentDateOfBirth 
        ? this.parseDate(createAdmissionDto.studentDateOfBirth)
        : undefined;
      
      let admissionDate = new Date();
      if (createAdmissionDto.admissionDate) {
        const parsedDate = this.parseDate(createAdmissionDto.admissionDate);
        if (parsedDate) {
          admissionDate = parsedDate;
        }
      }

      // Parse batch data
      let batchData = createAdmissionDto.batch_with_subjects;
      let batches: AdmissionBatch[] = [];
      
      if (batchData) {
        if (typeof batchData === 'string') {
          try {
            batchData = JSON.parse(batchData);
          } catch (error) {
            console.log('Failed to parse batch data:', batchData);
            // Try to fix common JSON issues
            try {
              // Handle the nested structure from your payload
              const parsed = JSON.parse(batchData);
              if (parsed['batch-index-0']) {
                batchData = [{
                  batchName: parsed['batch-index-0'].batch_name,
                  batchId: parsed['batch-index-0'].batch_id,
                  subjects: parsed['batch-index-0'].subjects?.map((s: any) => ({
                    subjectName: s.subject_name,
                    subjectId: s.subject_id
                  })) || [],
                  admissionFee: parsed['batch-index-0'].admission_fee,
                  tuitionFee: parsed['batch-index-0'].tution_fee,
                  courseFee: parsed['batch-index-0'].course_fee
                }];
              }
            } catch (e) {
              console.error('Failed to parse nested batch data:', e);
              batchData = null;
            }
          }
        }

        if (batchData && Array.isArray(batchData)) {
          batches = batchData.map((batch: any) => ({
            batch: new Types.ObjectId(),
            batchName: batch.batchName || batch.batch_name || '',
            batchId: Number(batch.batchId || batch.batch_id) || 0,
            subjects: Array.isArray(batch.subjects) ? batch.subjects.map((subject: any) => ({
              subjectName: subject.subjectName || subject.subject_name || '',
              subjectId: Number(subject.subjectId || subject.subject_id) || 0,
            })) : [],
            admissionFee: Number(batch.admissionFee || batch.admission_fee) || 0,
            tuitionFee: Number(batch.tuitionFee || batch.tution_fee) || 0,
            courseFee: Number(batch.courseFee || batch.course_fee) || 0,
          })) as AdmissionBatch[];
        }
      }

      // Prepare admission data
      const admissionData: Partial<Admission> = {
        registrationId: createAdmissionDto.registrationId.trim(),
        name: createAdmissionDto.name.trim(),
        instituteName: createAdmissionDto.instituteName.trim(),
        studentGender: createAdmissionDto.studentGender as Gender,
        religion: createAdmissionDto.religion as Religion,
        guardianMobileNumber: createAdmissionDto.guardianMobileNumber.trim(),
        admissionDate: admissionDate,
        status: AdmissionStatus.PENDING,
        isCompleted: false,
        createdBy: new Types.ObjectId(userId),
      };

      // Add optional fields if provided
      if (createAdmissionDto.nameNative) {
        admissionData.nameNative = createAdmissionDto.nameNative.trim();
      }
      if (studentDateOfBirth) {
        admissionData.studentDateOfBirth = studentDateOfBirth;
      }
      if (createAdmissionDto.presentAddress) {
        admissionData.presentAddress = createAdmissionDto.presentAddress.trim();
      }
      if (createAdmissionDto.permanentAddress) {
        admissionData.permanentAddress = createAdmissionDto.permanentAddress.trim();
      }
      if (createAdmissionDto.whatsappMobile) {
        admissionData.whatsappMobile = createAdmissionDto.whatsappMobile.trim();
      }
      if (createAdmissionDto.studentMobileNumber) {
        admissionData.studentMobileNumber = createAdmissionDto.studentMobileNumber.trim();
      }
      if (createAdmissionDto.fathersName) {
        admissionData.fathersName = createAdmissionDto.fathersName.trim();
      }
      if (createAdmissionDto.mothersName) {
        admissionData.mothersName = createAdmissionDto.mothersName.trim();
      }
      if (createAdmissionDto.motherMobileNumber) {
        admissionData.motherMobileNumber = createAdmissionDto.motherMobileNumber.trim();
      }
      if (createAdmissionDto.admissionType) {
        admissionData.admissionType = createAdmissionDto.admissionType;
      }
      if (createAdmissionDto.courseFee !== undefined) {
        admissionData.courseFee = Number(createAdmissionDto.courseFee);
      }
      if (createAdmissionDto.admissionFee !== undefined) {
        admissionData.admissionFee = Number(createAdmissionDto.admissionFee);
      }
      if (createAdmissionDto.tuitionFee !== undefined) {
        admissionData.tuitionFee = Number(createAdmissionDto.tuitionFee);
      }
      if (createAdmissionDto.referBy) {
        admissionData.referBy = createAdmissionDto.referBy.trim();
      }
      if (batches.length > 0) {
        admissionData.batches = batches;
      }

      console.log('Final admission data:', admissionData);

      const createdAdmission = new this.admissionModel(admissionData);
      const savedAdmission = await createdAdmission.save();
      
      // Populate user fields
      await savedAdmission.populate([
        { path: 'createdBy', select: 'email username role' },
        { path: 'updatedBy', select: 'email username role' }
      ]);
      
      return savedAdmission;
    } catch (error: any) {
      console.error('Error creating admission:', error);
      if (error.code === 11000) {
        throw new ConflictException('Registration ID already exists');
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  // Update admission by registration ID
  async update(
    registrationId: string, 
    updateAdmissionDto: UpdateAdmissionDto,
    userId?: string
  ): Promise<AdmissionDocument> {
    try {
      const admission = await this.admissionModel.findOne({ registrationId });
      
      if (!admission) {
        throw new NotFoundException(`Admission with registration ID ${registrationId} not found`);
      }

      const updateData: any = { ...updateAdmissionDto };

      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      // Parse dates if provided
      if (updateData.studentDateOfBirth) {
        updateData.studentDateOfBirth = this.parseDate(updateData.studentDateOfBirth);
      }
      if (updateData.admissionDate) {
        updateData.admissionDate = this.parseDate(updateData.admissionDate);
      }

      // Parse batch data if provided
      if (updateData.batch_with_subjects) {
        let batchData = updateData.batch_with_subjects;
        if (typeof batchData === 'string') {
          try {
            batchData = JSON.parse(batchData);
          } catch (error) {
            throw new BadRequestException('Invalid batch data format');
          }
        }

        if (Array.isArray(batchData)) {
          updateData.batches = batchData.map((batch: any) => ({
            batch: new Types.ObjectId(),
            batchName: batch.batchName || batch.batch_name || '',
            batchId: Number(batch.batchId || batch.batch_id) || 0,
            subjects: Array.isArray(batch.subjects) ? batch.subjects.map((subject: any) => ({
              subjectName: subject.subjectName || subject.subject_name || '',
              subjectId: Number(subject.subjectId || subject.subject_id) || 0,
            })) : [],
            admissionFee: Number(batch.admissionFee || batch.admission_fee) || 0,
            tuitionFee: Number(batch.tuitionFee || batch.tution_fee) || 0,
            courseFee: Number(batch.courseFee || batch.course_fee) || 0,
          })) as AdmissionBatch[];
        }
        
        delete updateData.batch_with_subjects;
      }

      // Handle status changes
      if (updateData.status === AdmissionStatus.COMPLETED && admission.status !== AdmissionStatus.COMPLETED) {
        updateData.completedAt = new Date();
        updateData.isCompleted = true;
      }

      if (updateData.status === AdmissionStatus.APPROVED && admission.status !== AdmissionStatus.APPROVED) {
        updateData.approvedAt = new Date();
        if (userId) {
          updateData.approvedBy = new Types.ObjectId(userId);
        }
      }

      // Update numeric fields
      if (updateData.courseFee !== undefined) updateData.courseFee = Number(updateData.courseFee);
      if (updateData.admissionFee !== undefined) updateData.admissionFee = Number(updateData.admissionFee);
      if (updateData.tuitionFee !== undefined) updateData.tuitionFee = Number(updateData.tuitionFee);
      if (updateData.paidAmount !== undefined) updateData.paidAmount = Number(updateData.paidAmount);

      // Update admission
      Object.assign(admission, updateData);
      await admission.save();

      // Populate user fields
      await admission.populate([
        { path: 'createdBy', select: 'email username role' },
        { path: 'updatedBy', select: 'email username role' },
        { path: 'approvedBy', select: 'email username role' }
      ]);

      return admission;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Registration ID already exists');
      }
      throw error;
    }
  }

  // Find admission by registration ID
  async findByRegistrationId(registrationId: string): Promise<AdmissionDocument> {
    if (!registrationId || registrationId.trim().length === 0) {
      throw new BadRequestException('Registration ID is required');
    }

    const admission = await this.admissionModel
      .findOne({ registrationId: registrationId.trim() })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .populate('approvedBy', 'email username role');
    
    if (!admission) {
      throw new NotFoundException(`Admission with registration ID ${registrationId} not found`);
    }
    
    return admission;
  }

  // Find all admissions with filters
  async findAll(
    filters: {
      status?: string;
      isCompleted?: boolean;
      admissionType?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      createdBy?: string;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ admissions: AdmissionDocument[]; total: number; page: number; limit: number }> {
    const { status, isCompleted, admissionType, startDate, endDate, search, createdBy } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted;
    }

    if (admissionType) {
      query.admissionType = admissionType;
    }

    if (createdBy) {
      if (!Types.ObjectId.isValid(createdBy)) {
        throw new BadRequestException('Invalid createdBy user ID');
      }
      query.createdBy = new Types.ObjectId(createdBy);
    }

    if (startDate || endDate) {
      query.admissionDate = {};
      if (startDate) {
        query.admissionDate.$gte = startDate;
      }
      if (endDate) {
        query.admissionDate.$lte = endDate;
      }
    }

    if (search) {
      query.$or = [
        { registrationId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { instituteName: { $regex: search, $options: 'i' } },
        { guardianMobileNumber: { $regex: search, $options: 'i' } },
        { whatsappMobile: { $regex: search, $options: 'i' } },
        { studentMobileNumber: { $regex: search, $options: 'i' } },
        { fathersName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [admissions, total] = await Promise.all([
      this.admissionModel
        .find(query)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.admissionModel.countDocuments(query).exec()
    ]);

    return {
      admissions,
      total,
      page,
      limit
    };
  }

  // Delete admission by registration ID
  async delete(registrationId: string): Promise<void> {
    if (!registrationId || registrationId.trim().length === 0) {
      throw new BadRequestException('Registration ID is required');
    }

    const result = await this.admissionModel.deleteOne({ 
      registrationId: registrationId.trim() 
    });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Admission with registration ID ${registrationId} not found`);
    }
  }

  // Get admission statistics
  async getStatistics(userId?: string): Promise<any> {
    const query: any = {};
    if (userId && Types.ObjectId.isValid(userId)) {
      query.createdBy = new Types.ObjectId(userId);
    }

    const [
      total,
      pending,
      completed,
      approved,
      rejected,
      todayAdmissions,
      thisMonthAdmissions,
    ] = await Promise.all([
      this.admissionModel.countDocuments(query),
      this.admissionModel.countDocuments({ ...query, status: AdmissionStatus.PENDING }),
      this.admissionModel.countDocuments({ ...query, status: AdmissionStatus.COMPLETED }),
      this.admissionModel.countDocuments({ ...query, status: AdmissionStatus.APPROVED }),
      this.admissionModel.countDocuments({ ...query, status: AdmissionStatus.REJECTED }),
      this.admissionModel.countDocuments({
        ...query,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      this.admissionModel.countDocuments({
        ...query,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        }
      }),
    ]);

    const totalRevenue = await this.admissionModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    return {
      total,
      pending,
      completed,
      approved,
      rejected,
      todayAdmissions,
      thisMonthAdmissions,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }

  // Get admissions by batch ID
  async getAdmissionsByBatchId(batchId: number) {
    if (!batchId || isNaN(batchId)) {
      throw new BadRequestException('Valid batch ID is required');
    }

    const admissions = await this.admissionModel
      .find({
        'batches.batchId': batchId
      })
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();

    return admissions;
  }

  // Get pending admissions count
  async getPendingCount(userId?: string): Promise<number> {
    const query: any = { status: AdmissionStatus.PENDING };
    if (userId && Types.ObjectId.isValid(userId)) {
      query.createdBy = new Types.ObjectId(userId);
    }
    
    return this.admissionModel.countDocuments(query).exec();
  }

  // Get admissions created by specific user
  async getMyAdmissions(userId: string, filters?: any, pagination?: any) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const query: any = { createdBy: new Types.ObjectId(userId) };
    
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }
    if (filters?.search) {
      query.$or = [
        { registrationId: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { instituteName: { $regex: filters.search, $options: 'i' } },
        { guardianMobileNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [admissions, total] = await Promise.all([
      this.admissionModel
        .find(query)
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.admissionModel.countDocuments(query).exec()
    ]);

    return {
      admissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}