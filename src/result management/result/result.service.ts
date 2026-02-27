import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';

import { CreateResultDto } from './dto/create-result.dto';
import { BulkCreateResultDto, StudentResultDto } from './dto/bulk-create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ResultQueryDto } from './dto/result-query.dto';

import { IResultStats, IResultSummary, IBulkResultResponse, IStudentResult } from './interfaces/result.interface';
import { Result, ResultDocument } from './result.schema';
import { Exam, ExamDocument } from '../create-exam/exam.schema';
import { Student, StudentDocument } from 'src/student/schemas/student.schema';

import { ResultResponseDto } from './dto/result-response.dto';
import { Subject } from 'rxjs';
import { SubjectDocument } from 'src/AcademicFunction/subject/subject.schema';

interface ErrorEntry {
  studentId: string;
  error: string;
}

@Injectable()
export class ResultService {
  constructor(
    @InjectModel(Result.name) private resultModel: Model<ResultDocument>,
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
  ) {}

  // Grading System Configuration based on your screenshot
  private readonly GRADING_SYSTEM = [
    { min: 80, max: 100, grade: 'A+', gpa: 5, passed: true },
    { min: 70, max: 79, grade: 'A', gpa: 4, passed: true },
    { min: 60, max: 69, grade: 'A-', gpa: 3.5, passed: true },
    { min: 50, max: 59, grade: 'B', gpa: 3, passed: true },
    { min: 40, max: 49, grade: 'C', gpa: 2, passed: true },
    { min: 33, max: 39, grade: 'D', gpa: 1, passed: true },
    { min: 0, max: 32, grade: 'F', gpa: 0, passed: false }
  ];

  // Helper: Calculate grade, GPA, and pass status based on percentage
  private calculateGradeInfo(percentage: number): { grade: string; gpa: number; isPassed: boolean } {
    // Find the matching grade from grading system
    const gradeInfo = this.GRADING_SYSTEM.find(grade => 
      percentage >= grade.min && percentage <= grade.max
    );
    
    if (!gradeInfo) {
      return { grade: 'F', gpa: 0, isPassed: false };
    }
    
    return {
      grade: gradeInfo.grade,
      gpa: gradeInfo.gpa,
      isPassed: gradeInfo.passed
    };
  }

  // Helper: Calculate remarks based on grade
  private calculateRemarks(grade: string): string {
    const remarksMap: Record<string, string> = {
      'A+': 'Outstanding performance',
      'A': 'Excellent performance',
      'A-': 'Very good performance',
      'B': 'Good performance',
      'C': 'Satisfactory performance',
      'D': 'Passed but needs improvement',
      'F': 'Failed - Needs to try harder'
    };
    return remarksMap[grade] || '';
  }

  // Helper: Calculate result class based on percentage
  private calculateResultClass(percentage: number): string {
    if (percentage >= 80) return 'distinction';
    if (percentage >= 60) return 'first_class';
    if (percentage >= 45) return 'second_class';
    if (percentage >= 33) return 'third_class';
    return 'failed';
  }

  // Helper: Legacy methods for backward compatibility
  private calculateGrade(percentage: number): string {
    return this.calculateGradeInfo(percentage).grade;
  }

  private calculateGPA(percentage: number): number {
    return this.calculateGradeInfo(percentage).gpa;
  }

  private determinePassStatus(percentage: number): boolean {
    return percentage >= 33;
  }

  private mapToResponseDto(result: ResultDocument | any): ResultResponseDto {
    try {
      const examDetails = (result as any).examDetails as any;
      const studentDetails = (result as any).studentDetails as any;
      const classDetails = (result as any).classDetails as any;
      const batchDetails = (result as any).batchDetails as any;
      const createdByUser = (result as any).createdByUser as any;
      const updatedByUser = (result as any).updatedByUser as any;
      const subjectDetails = (result as any).subjectDetails as any[];

      let subjectWiseMarks = [];
      if (result.subjectWiseMarks && result.subjectWiseMarks.length > 0) {
        if (subjectDetails && subjectDetails.length > 0) {
          subjectWiseMarks = result.subjectWiseMarks.map((mark: any, index: number) => {
            const subjectDetail = subjectDetails.find((s: any) => 
              s && mark.subject && s._id.toString() === mark.subject.toString()
            );
            return {
              subject: mark.subject?.toString() || '',
              subjectName: subjectDetail?.subjectName || mark.subjectName || '',
              totalMarks: mark.totalMarks || 0,
              obtainedMarks: mark.obtainedMarks || 0,
              percentage: mark.totalMarks > 0 ? (mark.obtainedMarks / mark.totalMarks) * 100 : 0
            };
          });
        } else {
          subjectWiseMarks = result.subjectWiseMarks.map((mark: any) => ({
            subject: mark.subject?.toString() || '',
            subjectName: mark.subjectName || '',
            totalMarks: mark.totalMarks || 0,
            obtainedMarks: mark.obtainedMarks || 0,
            percentage: mark.totalMarks > 0 ? (mark.obtainedMarks / mark.totalMarks) * 100 : 0
          }));
        }
      }

      const response: ResultResponseDto = {
        _id: result._id.toString(),
        exam: {
          _id: examDetails?._id?.toString() || result.exam.toString(),
          examName: examDetails?.examName || '',
          totalMarks: examDetails?.totalMarks || result.totalMarks,
          totalPassMarks: examDetails?.totalPassMarks,
          enableGrading: examDetails?.enableGrading || false,
          useGPASystem: examDetails?.useGPASystem || false,
        },
        student: {
          _id: studentDetails?._id?.toString() || result.student.toString(),
          registrationId: studentDetails?.registrationId || '',
          nameEnglish: studentDetails?.nameEnglish || '',
          class: studentDetails?.class?.toString() || result.class?.toString() || '',
          batch: studentDetails?.batch?.toString() || result.batch?.toString() || '',
        },
        class: {
          _id: classDetails?._id?.toString() || result.class.toString(),
          classname: classDetails?.classname || '',
        },
        batch: {
          _id: batchDetails?._id?.toString() || result.batch.toString(),
          batchName: batchDetails?.batchName || '',
          sessionYear: batchDetails?.sessionYear || '',
        },
        totalMarks: result.totalMarks,
        obtainedMarks: result.obtainedMarks,
        percentage: result.percentage,
        grade: result.grade,
        gpa: result.gpa,
        position: result.position,
        isPassed: result.isPassed,
        isAbsent: result.isAbsent,
        resultClass: result.resultClass,
        remarks: result.remarks,
        subjectWiseMarks: subjectWiseMarks,
        createdBy: {
          _id: createdByUser?._id?.toString() || result.createdBy.toString(),
          email: createdByUser?.email || '',
          username: createdByUser?.username || '',
          role: createdByUser?.role || '',
          name: createdByUser?.name,
        },
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      if (updatedByUser || result.updatedBy) {
        response.updatedBy = {
          _id: updatedByUser?._id?.toString() || result.updatedBy?.toString() || '',
          email: updatedByUser?.email || '',
          username: updatedByUser?.username || '',
          role: updatedByUser?.role || '',
          name: updatedByUser?.name,
        };
      }

      return response;
    } catch (error) {
      console.error('Error mapping result to response DTO:', error, result);
      throw new InternalServerErrorException('Error processing result data');
    }
  }

  async create(createResultDto: CreateResultDto, userId: string): Promise<ResultResponseDto> {
    const session = await this.resultModel.db.startSession();
    session.startTransaction();

    try {
      console.log('Creating result for student:', createResultDto.student);
      console.log('User ID received:', userId);

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      let userObjectId: Types.ObjectId;
      try {
        userObjectId = new Types.ObjectId(userId);
      } catch (error) {
        console.error('Failed to create ObjectId from userId:', userId, error);
        throw new BadRequestException('Invalid user ID format');
      }

      const idsToValidate = [
        { field: 'exam', id: createResultDto.exam },
        { field: 'student', id: createResultDto.student },
        { field: 'class', id: createResultDto.class },
        { field: 'batch', id: createResultDto.batch },
      ];

      for (const { field, id } of idsToValidate) {
        if (!Types.ObjectId.isValid(id)) {
          throw new BadRequestException(`Invalid ${field} ID`);
        }
      }

      const existingResult = await this.resultModel.findOne({
        exam: new Types.ObjectId(createResultDto.exam),
        student: new Types.ObjectId(createResultDto.student),
      }).session(session);

      if (existingResult) {
        throw new ConflictException('Result already exists for this student in this exam');
      }

      const exam = await this.examModel
        .findById(createResultDto.exam)
        .session(session)
        .exec();

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (createResultDto.totalMarks !== exam.totalMarks) {
        throw new BadRequestException(`Total marks must be ${exam.totalMarks} as per exam configuration`);
      }

      if (createResultDto.obtainedMarks > createResultDto.totalMarks) {
        throw new BadRequestException('Obtained marks cannot exceed total marks');
      }

      const student = await this.studentModel
        .findById(createResultDto.student)
        .session(session)
        .exec();

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (createResultDto.subjectWiseMarks && createResultDto.subjectWiseMarks.length > 0) {
        const subjectIds = createResultDto.subjectWiseMarks.map(sm => sm.subject);
        const uniqueSubjectIds = [...new Set(subjectIds)];
        
        const subjects = await this.subjectModel
          .find({ _id: { $in: uniqueSubjectIds.map(id => new Types.ObjectId(id)) } })
          .session(session)
          .exec();

        if (subjects.length !== uniqueSubjectIds.length) {
          throw new BadRequestException('One or more subjects not found');
        }

        const subjectMap = new Map<string, string>();
        subjects.forEach((subject: any) => {
          subjectMap.set(subject._id.toString(), subject.subjectName);
        });

        createResultDto.subjectWiseMarks.forEach((mark, index) => {
          if (!Types.ObjectId.isValid(mark.subject)) {
            throw new BadRequestException(`Invalid subject ID at index ${index}`);
          }
          
          if (mark.obtainedMarks > mark.totalMarks) {
            throw new BadRequestException(
              `Obtained marks (${mark.obtainedMarks}) exceed total marks (${mark.totalMarks}) for subject ${mark.subjectName || mark.subject}`
            );
          }

          if (mark.subjectName && subjectMap.has(mark.subject)) {
            const actualSubjectName = subjectMap.get(mark.subject);
            if (mark.subjectName !== actualSubjectName) {
              console.warn(`Subject name mismatch for ${mark.subject}: provided "${mark.subjectName}", actual "${actualSubjectName}"`);
            }
          }
        });

        const subjectTotal = createResultDto.subjectWiseMarks.reduce((sum, sm) => sum + sm.totalMarks, 0);
        const subjectObtained = createResultDto.subjectWiseMarks.reduce((sum, sm) => sum + sm.obtainedMarks, 0);
        
        if (Math.abs(subjectTotal - createResultDto.totalMarks) > 0.01) {
          throw new BadRequestException(
            `Sum of subject-wise total marks (${subjectTotal}) must equal overall total marks (${createResultDto.totalMarks})`
          );
        }
        
        if (Math.abs(subjectObtained - createResultDto.obtainedMarks) > 0.01) {
          throw new BadRequestException(
            `Sum of subject-wise obtained marks (${subjectObtained}) must equal overall obtained marks (${createResultDto.obtainedMarks})`
          );
        }
      }

      // Calculate percentage
      const percentage = (createResultDto.obtainedMarks / createResultDto.totalMarks) * 100;

      // AUTO-CALCULATION: Grade, GPA, Pass Status, Remarks, Result Class
      let grade = createResultDto.grade;
      let gpa = createResultDto.gpa;
      let isPassed = false;
      let remarks = createResultDto.remarks;
      let resultClass = createResultDto.resultClass;
      
      // Calculate based on grading system if exam has grading enabled
      if (exam.enableGrading) {
        const gradeInfo = this.calculateGradeInfo(percentage);
        
        if (!grade) {
          grade = gradeInfo.grade;
        }
        
        if (exam.useGPASystem && !gpa) {
          gpa = gradeInfo.gpa;
        }
        
        isPassed = gradeInfo.isPassed;
        
        if (!remarks) {
          remarks = this.calculateRemarks(grade);
        }
      } else {
        isPassed = !createResultDto.isAbsent && this.determinePassStatus(percentage);
      }

      if (!resultClass) {
        resultClass = this.calculateResultClass(percentage);
      }

      const subjectWiseMarksForDb = createResultDto.subjectWiseMarks?.map(mark => ({
        subject: new Types.ObjectId(mark.subject),
        subjectName: mark.subjectName,
        totalMarks: mark.totalMarks,
        obtainedMarks: mark.obtainedMarks,
      })) || [];

      const result = new this.resultModel({
        exam: new Types.ObjectId(createResultDto.exam),
        student: new Types.ObjectId(createResultDto.student),
        class: new Types.ObjectId(createResultDto.class),
        batch: new Types.ObjectId(createResultDto.batch),
        totalMarks: createResultDto.totalMarks,
        obtainedMarks: createResultDto.obtainedMarks,
        percentage,
        grade,
        gpa,
        isPassed,
        isAbsent: createResultDto.isAbsent || false,
        resultClass,
        remarks: remarks || '',
        subjectWiseMarks: subjectWiseMarksForDb,
        createdBy: userObjectId,
        isActive: true,
      });

      const savedResult = await result.save({ session });

      await this.updatePositions(createResultDto.exam, session);

      await session.commitTransaction();
      
      const populatedResult = await this.resultModel
        .findById(savedResult._id)
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      return this.mapToResponseDto(populatedResult);
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Create result error:', error);
      
      if (error.code === 11000) {
        throw new ConflictException('Result already exists');
      }
      if (error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create result');
    } finally {
      session.endSession();
    }
  }

  async bulkCreate(bulkCreateResultDto: BulkCreateResultDto, userId: string): Promise<IBulkResultResponse> {
    const session = await this.resultModel.db.startSession();
    session.startTransaction();

    try {
      console.log('Bulk creating results for exam:', bulkCreateResultDto.exam_id);
      console.log('Number of student results:', Object.keys(bulkCreateResultDto.results).length);

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      if (!Types.ObjectId.isValid(bulkCreateResultDto.exam_id)) {
        throw new BadRequestException('Invalid exam ID');
      }

      const exam = await this.examModel
        .findById(bulkCreateResultDto.exam_id)
        .session(session)
        .exec();

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      const studentIds = Object.keys(bulkCreateResultDto.results);
      if (studentIds.length === 0) {
        throw new BadRequestException('No student results provided');
      }

      const firstStudentId = studentIds[0];
      const firstStudent = await this.studentModel
        .findById(firstStudentId)
        .session(session)
        .exec();

      if (!firstStudent) {
        throw new NotFoundException(`Student with ID ${firstStudentId} not found`);
      }

      const classId = firstStudent.class;
      const batchId = firstStudent.batch;

      const studentPromises = studentIds.map(async (studentId) => {
        if (!Types.ObjectId.isValid(studentId)) {
          throw new BadRequestException(`Invalid student ID: ${studentId}`);
        }

        const student = await this.studentModel
          .findById(studentId)
          .session(session)
          .exec();

        if (!student) {
          throw new NotFoundException(`Student with ID ${studentId} not found`);
        }

        if (!student.class.equals(classId) || !student.batch.equals(batchId)) {
          throw new BadRequestException(`Student ${studentId} does not belong to the same class/batch`);
        }

        return student;
      });

      await Promise.all(studentPromises);

      const resultsToSave: Promise<ResultDocument>[] = [];
      const errors: ErrorEntry[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (const [studentId, resultData] of Object.entries(bulkCreateResultDto.results)) {
        try {
          if (!Types.ObjectId.isValid(studentId)) {
            errors.push({ studentId, error: 'Invalid student ID format' });
            failedCount++;
            continue;
          }

          const existingResult = await this.resultModel.findOne({
            exam: new Types.ObjectId(bulkCreateResultDto.exam_id),
            student: new Types.ObjectId(studentId),
          }).session(session);

          if (existingResult) {
            errors.push({ studentId, error: 'Result already exists for this student in this exam' });
            failedCount++;
            continue;
          }

          const obtainedMarks = parseFloat(resultData.only_total_marks.toString());
          if (isNaN(obtainedMarks)) {
            errors.push({ studentId, error: 'Invalid marks format' });
            failedCount++;
            continue;
          }

          if (obtainedMarks > exam.totalMarks) {
            errors.push({ studentId, error: `Obtained marks (${obtainedMarks}) exceed exam total marks (${exam.totalMarks})` });
            failedCount++;
            continue;
          }

          const percentage = (obtainedMarks / exam.totalMarks) * 100;

          // AUTO-CALCULATION FOR BULK CREATE
          let isPassed = false;
          let grade: string | undefined = resultData.grade && resultData.grade !== 'N/A' ? resultData.grade : undefined;
          let gpa: number | undefined = resultData.gpa && resultData.gpa !== 'N/A' ? parseFloat(resultData.gpa) : undefined;
          let remarks = '';
          let resultClass = '';

          if (exam.enableGrading) {
            const gradeInfo = this.calculateGradeInfo(percentage);
            
            if (!grade) {
              grade = gradeInfo.grade;
            }
            
            if (exam.useGPASystem && !gpa) {
              gpa = gradeInfo.gpa;
            }
            
            isPassed = gradeInfo.isPassed;
            remarks = this.calculateRemarks(grade);
          } else {
            isPassed = !resultData.is_absent && this.determinePassStatus(percentage);
          }

          resultClass = this.calculateResultClass(percentage);

          const result = new this.resultModel({
            exam: new Types.ObjectId(bulkCreateResultDto.exam_id),
            student: new Types.ObjectId(studentId),
            class: classId,
            batch: batchId,
            totalMarks: exam.totalMarks,
            obtainedMarks,
            percentage,
            grade,
            gpa,
            isPassed,
            isAbsent: resultData.is_absent || false,
            resultClass,
            remarks,
            createdBy: new Types.ObjectId(userId),
            isActive: true,
          });

          resultsToSave.push(result.save({ session }));
          successCount++;
        } catch (error: any) {
          console.error(`Error processing student ${studentId}:`, error);
          errors.push({ 
            studentId, 
            error: error.message || 'Failed to process result' 
          });
          failedCount++;
        }
      }

      const savedResults = await Promise.all(resultsToSave);

      await this.updatePositions(bulkCreateResultDto.exam_id, session);

      await session.commitTransaction();

      const populatedResults = await this.resultModel
        .find({
          _id: { $in: savedResults.map(r => r._id) }
        })
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .exec();

      return {
        successCount,
        failedCount,
        errors,
        results: populatedResults.map(result => this.mapToResponseDto(result)),
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Bulk create results error:', error);
      
      if (error instanceof BadRequestException ||
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to bulk create results');
    } finally {
      session.endSession();
    }
  }

  async findAll(queryDto: ResultQueryDto): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        exam,
        student,
        class: classId,
        batch: batchId,
        subject,
        grade,
        isPassed,
        isAbsent,
        isActive,
        createdBy,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = queryDto;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { 'studentDetails.registrationId': { $regex: search, $options: 'i' } },
          { 'studentDetails.nameEnglish': { $regex: search, $options: 'i' } },
          { 'examDetails.examName': { $regex: search, $options: 'i' } },
          { grade: { $regex: search, $options: 'i' } },
          { 'subjectWiseMarks.subjectName': { $regex: search, $options: 'i' } },
        ];
      }

      if (exam && Types.ObjectId.isValid(exam)) {
        filter.exam = new Types.ObjectId(exam);
      }

      if (student && Types.ObjectId.isValid(student)) {
        filter.student = new Types.ObjectId(student);
      }

      if (classId && Types.ObjectId.isValid(classId)) {
        filter.class = new Types.ObjectId(classId);
      }

      if (batchId && Types.ObjectId.isValid(batchId)) {
        filter.batch = new Types.ObjectId(batchId);
      }

      if (subject && Types.ObjectId.isValid(subject)) {
        filter['subjectWiseMarks.subject'] = new Types.ObjectId(subject);
      }

      if (grade) {
        filter.grade = grade;
      }

      if (isPassed !== undefined) {
        filter.isPassed = isPassed;
      }

      if (isAbsent !== undefined) {
        filter.isAbsent = isAbsent;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (createdBy && Types.ObjectId.isValid(createdBy)) {
        filter.createdBy = new Types.ObjectId(createdBy);
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.resultModel
          .find(filter)
          .populate('examDetails')
          .populate('studentDetails')
          .populate('classDetails')
          .populate('batchDetails')
          .populate('subjectDetails', 'subjectName subjectCode creditHours')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.resultModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(result => this.mapToResponseDto(result)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Find all results error:', error);
      throw new InternalServerErrorException('Failed to fetch results');
    }
  }

  async findOne(id: string): Promise<ResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid result ID');
      }

      const result = await this.resultModel
        .findById(id)
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!result) {
        throw new NotFoundException(`Result with ID ${id} not found`);
      }

      return this.mapToResponseDto(result);
    } catch (error) {
      console.error('Find one result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch result');
    }
  }

  async findByExamAndStudent(examId: string, studentId: string): Promise<ResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(examId)) {
        throw new BadRequestException('Invalid exam ID');
      }
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException('Invalid student ID');
      }

      const result = await this.resultModel
        .findOne({
          exam: new Types.ObjectId(examId),
          student: new Types.ObjectId(studentId),
        })
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!result) {
        throw new NotFoundException('Result not found for this student in this exam');
      }

      return this.mapToResponseDto(result);
    } catch (error) {
      console.error('Find by exam and student error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch result');
    }
  }

  async update(id: string, updateResultDto: UpdateResultDto, userId?: string): Promise<ResultResponseDto> {
    const session = await this.resultModel.db.startSession();
    session.startTransaction();

    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid result ID');
      }

      const existingResult = await this.resultModel
        .findById(id)
        .populate('examDetails')
        .session(session)
        .exec();

      if (!existingResult) {
        throw new NotFoundException(`Result with ID ${id} not found`);
      }

      const exam = existingResult.examDetails as any;

      const updateData: any = { ...updateResultDto };
      
      if (updateResultDto.obtainedMarks !== undefined || updateResultDto.totalMarks !== undefined) {
        const totalMarks = updateResultDto.totalMarks !== undefined ? updateResultDto.totalMarks : existingResult.totalMarks;
        const obtainedMarks = updateResultDto.obtainedMarks !== undefined ? updateResultDto.obtainedMarks : existingResult.obtainedMarks;
        
        if (obtainedMarks > totalMarks) {
          throw new BadRequestException('Obtained marks cannot exceed total marks');
        }

        const percentage = (obtainedMarks / totalMarks) * 100;
        updateData.percentage = percentage;
        updateData.totalMarks = totalMarks;
        updateData.obtainedMarks = obtainedMarks;
        
        // AUTO-RECALCULATION ON UPDATE
        if (exam.enableGrading) {
          const gradeInfo = this.calculateGradeInfo(percentage);
          
          if (!updateResultDto.grade) {
            updateData.grade = gradeInfo.grade;
          }
          
          if (exam.useGPASystem && !updateResultDto.gpa) {
            updateData.gpa = gradeInfo.gpa;
          }
          
          updateData.isPassed = gradeInfo.isPassed;
          
          if (!updateResultDto.remarks) {
            updateData.remarks = this.calculateRemarks(updateData.grade || gradeInfo.grade);
          }
        } else {
          updateData.isPassed = !updateResultDto.isAbsent && this.determinePassStatus(percentage);
        }
        
        if (!updateResultDto.resultClass) {
          updateData.resultClass = this.calculateResultClass(percentage);
        }
      }
      
      if (updateResultDto.subjectWiseMarks && updateResultDto.subjectWiseMarks.length > 0) {
        updateData.subjectWiseMarks = updateResultDto.subjectWiseMarks.map(mark => ({
          subject: new Types.ObjectId(mark.subject),
          subjectName: mark.subjectName,
          totalMarks: mark.totalMarks,
          obtainedMarks: mark.obtainedMarks,
        }));
      }
      
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const updatedResult = await this.resultModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (updateResultDto.obtainedMarks !== undefined) {
        await this.updatePositions(existingResult.exam.toString(), session);
      }

      await session.commitTransaction();

      return this.mapToResponseDto(updatedResult);
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Update result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update result');
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid result ID');
      }

      const result = await this.resultModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Result with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Delete result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete result');
    }
  }

  async getExamResults(examId: string, queryDto?: ResultQueryDto): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(examId)) {
        throw new BadRequestException('Invalid exam ID');
      }

      const {
        page = 1,
        limit = 100,
        sortBy = 'position',
        sortOrder = 'asc',
        ...otherFilters
      } = queryDto || {};

      const filter: any = {
        exam: new Types.ObjectId(examId),
        ...otherFilters,
      };

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(500, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.resultModel
          .find(filter)
          .populate('examDetails')
          .populate('studentDetails')
          .populate('classDetails')
          .populate('batchDetails')
          .populate('subjectDetails', 'subjectName subjectCode creditHours')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.resultModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(result => this.mapToResponseDto(result)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Get exam results error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch exam results');
    }
  }

  async getStudentResults(studentId: string, queryDto?: ResultQueryDto): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(studentId)) {
        throw new BadRequestException('Invalid student ID');
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...otherFilters
      } = queryDto || {};

      const filter: any = {
        student: new Types.ObjectId(studentId),
        ...otherFilters,
      };

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.resultModel
          .find(filter)
          .populate('examDetails')
          .populate('studentDetails')
          .populate('classDetails')
          .populate('batchDetails')
          .populate('subjectDetails', 'subjectName subjectCode creditHours')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.resultModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(result => this.mapToResponseDto(result)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Get student results error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch student results');
    }
  }

  async getResultSummary(examId: string): Promise<IResultSummary> {
    try {
      if (!Types.ObjectId.isValid(examId)) {
        throw new BadRequestException('Invalid exam ID');
      }

      const exam = await this.examModel.findById(examId).exec();
      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      const results = await this.resultModel
        .find({ exam: new Types.ObjectId(examId) })
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .sort({ obtainedMarks: -1 })
        .exec();

      if (results.length === 0) {
        return {
          examId,
          examName: exam.examName,
          className: exam.className,
          batchName: exam.batchName,
          subjectName: exam.subjectName,
          totalStudents: 0,
          presentStudents: 0,
          passedStudents: 0,
          failedStudents: 0,
          absentStudents: 0,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          topPerformers: [],
        };
      }

      const presentResults = results.filter(r => !r.isAbsent);
      const passedResults = results.filter(r => r.isPassed);
      const failedResults = results.filter(r => !r.isPassed && !r.isAbsent);
      const absentResults = results.filter(r => r.isAbsent);

      const totalMarks = presentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
      const averageMarks = presentResults.length > 0 ? totalMarks / presentResults.length : 0;
      const highestMarks = presentResults.length > 0 ? Math.max(...presentResults.map(r => r.obtainedMarks)) : 0;
      const lowestMarks = presentResults.length > 0 ? Math.min(...presentResults.map(r => r.obtainedMarks)) : 0;

      const topPerformers = results
        .slice(0, 5)
        .map((result, index) => {
          const student = result.studentDetails as any;
          return {
            studentId: (student._id as Types.ObjectId).toString(),
            registrationId: student.registrationId,
            name: student.nameEnglish,
            marks: result.obtainedMarks,
            percentage: result.percentage,
            grade: result.grade,
            gpa: result.gpa,
            isPassed: result.isPassed,
            isAbsent: result.isAbsent,
            position: index + 1,
          };
        });

      return {
        examId,
        examName: exam.examName,
        className: exam.className,
        batchName: exam.batchName,
        subjectName: exam.subjectName,
        totalStudents: results.length,
        presentStudents: presentResults.length,
        passedStudents: passedResults.length,
        failedStudents: failedResults.length,
        absentStudents: absentResults.length,
        averageMarks,
        highestMarks,
        lowestMarks,
        topPerformers,
      };
    } catch (error) {
      console.error('Get result summary error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get result summary');
    }
  }

  async getStats(examId?: string, classId?: string, batchId?: string): Promise<IResultStats> {
    try {
      const filter: any = {};

      if (examId) {
        if (!Types.ObjectId.isValid(examId)) {
          throw new BadRequestException('Invalid exam ID');
        }
        filter.exam = new Types.ObjectId(examId);
      }

      if (classId) {
        if (!Types.ObjectId.isValid(classId)) {
          throw new BadRequestException('Invalid class ID');
        }
        filter.class = new Types.ObjectId(classId);
      }

      if (batchId) {
        if (!Types.ObjectId.isValid(batchId)) {
          throw new BadRequestException('Invalid batch ID');
        }
        filter.batch = new Types.ObjectId(batchId);
      }

      const results = await this.resultModel.find(filter).exec();

      if (results.length === 0) {
        return {
          totalResults: 0,
          passedCount: 0,
          failedCount: 0,
          absentCount: 0,
          averagePercentage: 0,
          highestMarks: 0,
          lowestMarks: 0,
          gradeDistribution: {},
        };
      }

      const presentResults = results.filter(r => !r.isAbsent);
      const passedResults = results.filter(r => r.isPassed);
      const failedResults = results.filter(r => !r.isPassed && !r.isAbsent);
      const absentResults = results.filter(r => r.isAbsent);

      const totalPercentage = presentResults.reduce((sum, r) => sum + r.percentage, 0);
      const averagePercentage = presentResults.length > 0 ? totalPercentage / presentResults.length : 0;
      const highestMarks = presentResults.length > 0 ? Math.max(...presentResults.map(r => r.obtainedMarks)) : 0;
      const lowestMarks = presentResults.length > 0 ? Math.min(...presentResults.map(r => r.obtainedMarks)) : 0;

      const gradeDistribution: Record<string, number> = {};
      results.forEach(result => {
        if (result.grade) {
          gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
        }
      });

      return {
        totalResults: results.length,
        passedCount: passedResults.length,
        failedCount: failedResults.length,
        absentCount: absentResults.length,
        averagePercentage,
        highestMarks,
        lowestMarks,
        gradeDistribution,
      };
    } catch (error) {
      console.error('Get stats error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get result statistics');
    }
  }

  private async updatePositions(examId: string, session?: ClientSession): Promise<void> {
    try {
      const results = await this.resultModel
        .find({ exam: new Types.ObjectId(examId), isAbsent: false })
        .sort({ obtainedMarks: -1 })
        .session(session || null)
        .exec();

      let currentPosition = 1;
      let previousMarks: number | null = null;
      let sameRankCount = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (previousMarks === null || result.obtainedMarks < previousMarks) {
          currentPosition += sameRankCount;
          sameRankCount = 1;
        } else {
          sameRankCount++;
        }

        await this.resultModel
          .findByIdAndUpdate(
            result._id,
            { position: currentPosition },
            { session: session || null }
          )
          .exec();

        previousMarks = result.obtainedMarks;
      }

      await this.resultModel
        .updateMany(
          { exam: new Types.ObjectId(examId), isAbsent: true },
          { position: 0 },
          { session: session || null || undefined }
        )
        .exec();
    } catch (error) {
      console.error('Update positions error:', error);
      throw new InternalServerErrorException('Failed to update positions');
    }
  }

  async toggleActive(id: string, userId: string): Promise<ResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid result ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const result = await this.resultModel.findById(id).exec();
      if (!result) {
        throw new NotFoundException('Result not found');
      }

      result.isActive = !result.isActive;
      result.updatedBy = new Types.ObjectId(userId);
      
      await result.save();
      
      const populatedResult = await this.resultModel
        .findById(result._id)
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
        .populate('subjectDetails', 'subjectName subjectCode creditHours')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      return this.mapToResponseDto(populatedResult);
    } catch (error) {
      console.error('Toggle active error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to toggle result status');
    }
  }

  async getStudentsForResultEntry(classId: string, batchId: string): Promise<IStudentResult[]> {
    try {
      console.log('Querying for class:', classId, 'batch:', batchId);
      
      const students = await this.studentModel
        .find({
          class: classId,
          batch: batchId,
          isActive: true,
          status: 'active',
        })
        .lean()
        .sort({ registrationId: 1 })
        .exec();

      console.log('Query result count:', students.length);
      
      if (students.length > 0) {
        console.log('First student sample:', {
          _id: students[0]._id,
          registrationId: students[0].registrationId,
          name: students[0].nameEnglish,
          class: students[0].class,
          batch: students[0].batch,
        });
      }

      return students.map(student => ({
        studentId: student._id.toString(),
        registrationId: student.registrationId,
        name: student.nameEnglish,
        marks: 0,
        percentage: 0,
        isPassed: false,
        isAbsent: false,
      }));
    } catch (error) {
      console.error('Get students for result entry error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch students for result entry');
    }
  }

  async getResultsByCreator(userId: string, queryDto?: ResultQueryDto): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...otherFilters
      } = queryDto || {};

      const filter: any = {
        createdBy: new Types.ObjectId(userId),
        ...otherFilters,
      };

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.resultModel
          .find(filter)
          .populate('examDetails')
          .populate('studentDetails')
          .populate('classDetails')
          .populate('batchDetails')
          .populate('subjectDetails', 'subjectName subjectCode creditHours')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.resultModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(result => this.mapToResponseDto(result)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Get results by creator error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user results');
    }
  }
}