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
        createdAt: (student as any).createdAt,
        updatedAt: (student as any).updatedAt
      };
    } catch (error) {
      console.error('Error mapping student to response DTO:', error, student);
      throw new InternalServerErrorException('Error processing student data');
    }
  }

  async create(createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    try {
      console.log('Creating student with registration ID:', createStudentDto.registrationId);

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

      const createdStudent = new this.studentModel(createStudentDto);
      const savedStudent = await createdStudent.save();
      console.log('Student created successfully:', savedStudent.registrationId);
      
      const populatedStudent = await this.studentModel
        .findById(savedStudent._id)
        .populate('classDetails')
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
        admissionType
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

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const students = await this.studentModel
        .find(filter)
        .populate('classDetails')
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

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
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

      const student = await this.studentModel
        .findByIdAndUpdate(id, updateStudentDto, { new: true })
        .populate('classDetails')
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

  async updateStatus(id: string, status: string, isActive: boolean): Promise<StudentResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid student ID');
      }

      const student = await this.studentModel
        .findByIdAndUpdate(
          id,
          { status, isActive },
          { new: true }
        )
        .populate('classDetails')
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

  async makePayment(id: string, amount: number): Promise<StudentResponseDto> {
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
      
      if (student.admissionType === AdmissionType.MONTHLY) {
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        student.nextPaymentDate = nextDate;
      }

      const updatedStudent = await student.save();
      
      const populatedStudent = await this.studentModel
        .findById(updatedStudent._id)
        .populate('classDetails')
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

  async getStatistics(): Promise<any> {
    try {
      const [totalStudents, activeStudents, totalDue, duePayments, monthlyStudents] = await Promise.all([
        this.studentModel.countDocuments(),
        this.studentModel.countDocuments({ isActive: true }),
        this.studentModel.aggregate([
          { $group: { _id: null, total: { $sum: '$dueAmount' } } }
        ]),
        this.studentModel.countDocuments({
          dueAmount: { $gt: 0 },
          isActive: true
        }),
        this.studentModel.countDocuments({
          admissionType: AdmissionType.MONTHLY,
          isActive: true
        }),
      ]);

      const classDistribution = await this.studentModel.aggregate([
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
}