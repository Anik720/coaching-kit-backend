// student/student.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    const createdStudent = new this.studentModel(createStudentDto);
    const savedStudent = await createdStudent.save();
    
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
  }

  async findAll(query: any): Promise<StudentResponseDto[]> {
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
  }

  async findOne(id: string): Promise<StudentResponseDto> {
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
  }

  async findByRegistrationId(registrationId: string): Promise<StudentResponseDto> {
    const student = await this.studentModel
      .findOne({ registrationId })
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
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
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
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }

  async updateStatus(id: string, status: string, isActive: boolean): Promise<StudentResponseDto> {
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
  }

  async makePayment(id: string, amount: number): Promise<StudentResponseDto> {
    const student = await this.studentModel.findById(id);
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    const newPaidAmount = (student.paidAmount || 0) + amount;
    
    if (newPaidAmount > (student.totalAmount || 0)) {
      throw new Error('Payment amount exceeds total amount due');
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
  }

  async getStatistics(): Promise<any> {
    const totalStudents = await this.studentModel.countDocuments();
    const activeStudents = await this.studentModel.countDocuments({ isActive: true });
    const totalDue = await this.studentModel.aggregate([
      { $group: { _id: null, total: { $sum: '$dueAmount' } } }
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
      classDistribution
    };
  }

  // --- THIS METHOD MUST BE INSIDE THE CLASS ---
  private mapToResponseDto(student: StudentDocument | any): StudentResponseDto {
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
  }
} // <--- End of Class StudentService
