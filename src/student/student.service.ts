import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdmissionType, Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  private mapToResponseDto(student: StudentDocument | any): StudentResponseDto {
    try {
      const classDetails = (student as any).classDetails as any;
      const batchDetails = (student as any).batchDetails as any;
      const createdByUser = (student as any).createdByUser as any;
      const updatedByUser = (student as any).updatedByUser as any;
      const studentId = (student as any)._id;

      return {
        _id: studentId?.toString(),
        registrationId: student.registrationId,
        class: classDetails ? {
          _id: classDetails._id.toString(),
          classname: classDetails.classname
        } : undefined,
        batch: batchDetails ? {
          _id: batchDetails._id.toString(),
          batchName: batchDetails.batchName,
          sessionYear: batchDetails.sessionYear,
          batchStartingDate: batchDetails.batchStartingDate,
          batchClosingDate: batchDetails.batchClosingDate
        } : undefined,
        nameEnglish: student.nameEnglish,
        subunitCategory: student.subunitCategory,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        religion: student.religion,
        studentMobileNumber: student.studentMobileNumber,
        wardNumber: student.wardNumber,
        presentAddress: student.presentAddress,
        permanentAddress: student.permanentAddress,
        photoUrl: student.photoUrl,
        fatherName: student.fatherName,
        fatherMobileNumber: student.fatherMobileNumber,
        motherName: student.motherName,
        motherMobileNumber: student.motherMobileNumber,
        admissionType: student.admissionType,
        admissionFee: student.admissionFee,
        monthlyTuitionFee: student.monthlyTuitionFee,
        courseFee: student.courseFee,
        totalAmount: student.totalAmount,
        paidAmount: student.paidAmount,
        dueAmount: student.dueAmount,
        admissionDate: student.admissionDate,
        nextPaymentDate: student.nextPaymentDate,
        referredBy: student.referredBy,
        status: student.status,
        isActive: student.isActive,
        remarks: student.remarks,
        createdBy: createdByUser ? {
          _id: createdByUser._id.toString(),
          email: createdByUser.email,
          username: createdByUser.username,
          role: createdByUser.role,
          name: createdByUser.name
        } : undefined,
        updatedBy: updatedByUser ? {
          _id: updatedByUser._id.toString(),
          email: updatedByUser.email,
          username: updatedByUser.username,
          role: updatedByUser.role,
          name: updatedByUser.name
        } : undefined,
        createdAt: (student as any).createdAt,
        updatedAt: (student as any).updatedAt
      };
    } catch (error) {
      console.error('Error mapping student to response DTO:', error, student);
      throw new InternalServerErrorException('Error processing student data');
    }
  }

  async create(createStudentDto: CreateStudentDto, userId: string): Promise<StudentResponseDto> {
    try {
      console.log('Creating student with registration ID:', createStudentDto.registrationId);

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if registration ID already exists
      if (createStudentDto.registrationId) {
        const existingStudent = await this.studentModel.findOne({ 
          registrationId: createStudentDto.registrationId 
        });
        
        if (existingStudent) {
          console.log('Registration ID already exists:', createStudentDto.registrationId);
          throw new ConflictException('Registration ID already exists');
        }
      }

      const createdStudent = new this.studentModel({
        ...createStudentDto,
        createdBy: new Types.ObjectId(userId)
      });
      
      const savedStudent = await createdStudent.save();
      console.log('Student created successfully:', savedStudent.registrationId);
      
      const populatedStudent = await this.studentModel
        .findById(savedStudent._id)
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!populatedStudent) {
        throw new Error('Failed to create student');
      }

      return this.mapToResponseDto(populatedStudent);
    } catch (error: any) {
      console.error('Student creation error:', error);
      if (error.code === 11000) {
        throw new ConflictException('Registration ID already exists');
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Student creation failed');
    }
  }

  async findAll(query: any): Promise<StudentResponseDto[]> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        class: classId,
        batch: batchId,
        status,
        isActive,
        gender,
        admissionType,
        createdBy
      } = query;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { nameEnglish: { $regex: search, $options: 'i' } },
          { registrationId: { $regex: search, $options: 'i' } },
          { fatherName: { $regex: search, $options: 'i' } },
          { fatherMobileNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (classId && Types.ObjectId.isValid(classId)) {
        filter.class = new Types.ObjectId(classId);
      }

      if (batchId && Types.ObjectId.isValid(batchId)) {
        filter.batch = new Types.ObjectId(batchId);
      }

      if (status) filter.status = status;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (gender) filter.gender = gender;
      if (admissionType) filter.admissionType = admissionType;
      if (createdBy && Types.ObjectId.isValid(createdBy)) {
        filter.createdBy = new Types.ObjectId(createdBy);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const students = await this.studentModel
        .find(filter)
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec();

      return students.map(student => this.mapToResponseDto(student));
    } catch (error) {
      console.error('Find all students error:', error);
      throw new InternalServerErrorException('Failed to fetch students');
    }
  }

  async findOne(id: string): Promise<StudentResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      const student = await this.studentModel
        .findById(id)
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return this.mapToResponseDto(student);
    } catch (error) {
      console.error('Find one student error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch student');
    }
  }

  async findByRegistrationId(registrationId: string): Promise<StudentResponseDto> {
    try {
      if (!registrationId || registrationId.trim().length === 0) {
        throw new BadRequestException('Registration ID is required');
      }

      const student = await this.studentModel
        .findOne({ registrationId: registrationId.trim() })
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!student) {
        throw new NotFoundException(`Student with registration ID ${registrationId} not found`);
      }

      return this.mapToResponseDto(student);
    } catch (error) {
      console.error('Find by registration ID error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch student by registration ID');
    }
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, userId?: string): Promise<StudentResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      // Check for duplicate registration ID if updating
      if (updateStudentDto.registrationId) {
        const existingStudent = await this.studentModel.findOne({ 
          registrationId: updateStudentDto.registrationId,
          _id: { $ne: new Types.ObjectId(id) }
        });
        
        if (existingStudent) {
          throw new ConflictException('Registration ID already exists');
        }
      }

      const updateData: any = { ...updateStudentDto };
      
      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const student = await this.studentModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return this.mapToResponseDto(student);
    } catch (error: any) {
      console.error('Update student error:', error);
      if (error.code === 11000) {
        throw new ConflictException('Registration ID already exists');
      }
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update student');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      const result = await this.studentModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Delete student error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete student');
    }
  }

  async updateStatus(id: string, status: string, isActive: boolean, userId?: string): Promise<StudentResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      const updateData: any = { status, isActive };
      
      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const student = await this.studentModel
        .findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        )
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return this.mapToResponseDto(student);
    } catch (error) {
      console.error('Update student status error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update student status');
    }
  }

  async makePayment(id: string, amount: number, userId?: string): Promise<StudentResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      if (amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }

      const student = await this.studentModel.findById(id);
      
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      const newPaidAmount = (student.paidAmount || 0) + amount;
      
      if (newPaidAmount > (student.totalAmount || 0)) {
        throw new BadRequestException('Payment amount exceeds total amount due');
      }

      student.paidAmount = newPaidAmount;
      student.dueAmount = (student.totalAmount || 0) - newPaidAmount;
      
      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        student.updatedBy = new Types.ObjectId(userId);
      }
      
      if (student.admissionType === AdmissionType.MONTHLY) {
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        student.nextPaymentDate = nextDate;
      }

      const updatedStudent = await student.save();
      
      const populatedStudent = await this.studentModel
        .findById(updatedStudent._id)
        .populate('classDetails')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate({
          path: 'batchDetails',
          populate: [
            { path: 'classDetails' },
            { path: 'groupDetails' },
            { path: 'subjectDetails' }
          ]
        })
        .exec();

      if (!populatedStudent) {
        throw new Error('Failed to load student after payment');
      }

      return this.mapToResponseDto(populatedStudent);
    } catch (error) {
      console.error('Make payment error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process payment');
    }
  }

  async getStatistics(userId?: string): Promise<any> {
    try {
      const query: any = {};
      if (userId && Types.ObjectId.isValid(userId)) {
        query.createdBy = new Types.ObjectId(userId);
      }

      const [totalStudents, activeStudents, totalDue, duePayments, monthlyStudents] = await Promise.all([
        this.studentModel.countDocuments(query),
        this.studentModel.countDocuments({ ...query, isActive: true }),
        this.studentModel.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$dueAmount' } } }
        ]),
        this.studentModel.countDocuments({
          ...query,
          dueAmount: { $gt: 0 },
          isActive: true
        }),
        this.studentModel.countDocuments({
          ...query,
          admissionType: AdmissionType.MONTHLY,
          isActive: true
        }),
      ]);

      const classDistribution = await this.studentModel.aggregate([
        { $match: query },
        { $group: { _id: '$class', count: { $sum: 1 } } },
        { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
        { $unwind: '$class' },
        { $project: { className: '$class.classname', count: 1 } }
      ]);

      return {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        totalDueAmount: totalDue[0]?.total || 0,
        duePayments,
        monthlyStudents,
        classDistribution
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      throw new InternalServerErrorException('Failed to get student statistics');
    }
  }

  async getMyStudents(userId: string, filters?: any, pagination?: any) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const query: any = { createdBy: new Types.ObjectId(userId) };
      
      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      if (filters?.search) {
        query.$or = [
          { nameEnglish: { $regex: filters.search, $options: 'i' } },
          { registrationId: { $regex: filters.search, $options: 'i' } },
          { fatherName: { $regex: filters.search, $options: 'i' } },
          { fatherMobileNumber: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters?.classId && Types.ObjectId.isValid(filters.classId)) {
        query.class = new Types.ObjectId(filters.classId);
      }
      if (filters?.batchId && Types.ObjectId.isValid(filters.batchId)) {
        query.batch = new Types.ObjectId(filters.batchId);
      }

      const { page = 1, limit = 10 } = pagination || {};
      const skip = (page - 1) * limit;

      const [students, total] = await Promise.all([
        this.studentModel
          .find(query)
          .populate('classDetails')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .populate({
            path: 'batchDetails',
            populate: [
              { path: 'classDetails' },
              { path: 'groupDetails' },
              { path: 'subjectDetails' }
            ]
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.studentModel.countDocuments(query).exec()
      ]);

      return {
        students: students.map(student => this.mapToResponseDto(student)),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get my students error:', error);
      throw new InternalServerErrorException('Failed to fetch user students');
    }
  }

  async countStudentsByUser(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      return this.studentModel.countDocuments({ 
        createdBy: new Types.ObjectId(userId) 
      }).exec();
    } catch (error) {
      console.error('Count students by user error:', error);
      throw new InternalServerErrorException('Failed to count user students');
    }
  }

  async countActiveStudentsByUser(userId: string): Promise<number> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      return this.studentModel.countDocuments({ 
        createdBy: new Types.ObjectId(userId),
        isActive: true 
      }).exec();
    } catch (error) {
      console.error('Count active students by user error:', error);
      throw new InternalServerErrorException('Failed to count active user students');
    }
  }
}