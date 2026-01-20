import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
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
  ) {}

  private mapToResponseDto(result: ResultDocument | any): ResultResponseDto {
    try {
      // Handle cases where references might not be populated
      const examDetails = (result as any).examDetails as any;
      const studentDetails = (result as any).studentDetails as any;
      const classDetails = (result as any).classDetails as any;
      const batchDetails = (result as any).batchDetails as any;
      const createdByUser = (result as any).createdByUser as any;
      const updatedByUser = (result as any).updatedByUser as any;

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
        subjectWiseMarks: result.subjectWiseMarks || [],
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

      // Add updatedBy if exists
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

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate all IDs
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

      // Check if result already exists for this student in this exam
      const existingResult = await this.resultModel.findOne({
        exam: new Types.ObjectId(createResultDto.exam),
        student: new Types.ObjectId(createResultDto.student),
      }).session(session);

      if (existingResult) {
        throw new ConflictException('Result already exists for this student in this exam');
      }

      // Get exam details
      const exam = await this.examModel
        .findById(createResultDto.exam)
        .session(session)
        .exec();

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      // Validate total marks
      if (createResultDto.totalMarks !== exam.totalMarks) {
        throw new BadRequestException(`Total marks must be ${exam.totalMarks} as per exam configuration`);
      }

      // Validate obtained marks don't exceed total marks
      if (createResultDto.obtainedMarks > createResultDto.totalMarks) {
        throw new BadRequestException('Obtained marks cannot exceed total marks');
      }

      // Get student details
      const student = await this.studentModel
        .findById(createResultDto.student)
        .session(session)
        .exec();

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // Calculate percentage
      const percentage = (createResultDto.obtainedMarks / createResultDto.totalMarks) * 100;

      // Determine pass/fail based on exam configuration
      let isPassed = false;
      if (createResultDto.isAbsent) {
        isPassed = false;
      } else if (exam.enableGrading && exam.totalPassMarks !== undefined) {
        isPassed = createResultDto.obtainedMarks >= exam.totalPassMarks;
      } else {
        // Default passing criteria (40%)
        isPassed = percentage >= 40;
      }

      // Calculate grade and GPA if enabled
      let grade = createResultDto.grade;
      let gpa = createResultDto.gpa;
      
      if (exam.enableGrading) {
        if (!grade && exam.useGPASystem) {
          // Calculate GPA based on percentage (simplified)
          const calculatedGrade = this.calculateGrade(percentage);
          const calculatedGPA = this.calculateGPA(percentage);
          grade = calculatedGrade;
          gpa = calculatedGPA;
        } else if (!grade) {
          const calculatedGrade = this.calculateGrade(percentage);
          grade = calculatedGrade;
        }
      }

      // Determine result class
      const resultClass = this.determineResultClass(percentage);

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
        remarks: createResultDto.remarks,
        subjectWiseMarks: createResultDto.subjectWiseMarks || [],
        createdBy: new Types.ObjectId(userId),
        isActive: true,
      });

      const savedResult = await result.save({ session });

      // Update position after saving all results
      await this.updatePositions(createResultDto.exam, session);

      await session.commitTransaction();
      
      // Populate and return
      const populatedResult = await this.resultModel
        .findById(savedResult._id)
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
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

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate exam ID
      if (!Types.ObjectId.isValid(bulkCreateResultDto.exam_id)) {
        throw new BadRequestException('Invalid exam ID');
      }

      // Get exam details
      const exam = await this.examModel
        .findById(bulkCreateResultDto.exam_id)
        .session(session)
        .exec();

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      // Get class and batch from first student (assuming all students are from same class/batch)
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

      // Validate all students exist and belong to same class/batch
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

        // Verify student belongs to same class and batch
        if (!student.class.equals(classId) || !student.batch.equals(batchId)) {
          throw new BadRequestException(`Student ${studentId} does not belong to the same class/batch`);
        }

        return student;
      });

      await Promise.all(studentPromises);

      // Process each student result
      const resultsToSave: Promise<ResultDocument>[] = [];
      const errors: ErrorEntry[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (const [studentId, resultData] of Object.entries(bulkCreateResultDto.results)) {
        try {
          // Validate student ID
          if (!Types.ObjectId.isValid(studentId)) {
            errors.push({ studentId, error: 'Invalid student ID format' });
            failedCount++;
            continue;
          }

          // Check if result already exists
          const existingResult = await this.resultModel.findOne({
            exam: new Types.ObjectId(bulkCreateResultDto.exam_id),
            student: new Types.ObjectId(studentId),
          }).session(session);

          if (existingResult) {
            errors.push({ studentId, error: 'Result already exists for this student in this exam' });
            failedCount++;
            continue;
          }

          // Parse marks from string to number
          const obtainedMarks = parseFloat(resultData.only_total_marks.toString());
          if (isNaN(obtainedMarks)) {
            errors.push({ studentId, error: 'Invalid marks format' });
            failedCount++;
            continue;
          }

          // Validate marks don't exceed exam total
          if (obtainedMarks > exam.totalMarks) {
            errors.push({ studentId, error: `Obtained marks (${obtainedMarks}) exceed exam total marks (${exam.totalMarks})` });
            failedCount++;
            continue;
          }

          // Calculate percentage
          const percentage = (obtainedMarks / exam.totalMarks) * 100;

          // Determine pass/fail
          let isPassed = false;
          if (resultData.is_absent) {
            isPassed = false;
          } else if (exam.enableGrading && exam.totalPassMarks !== undefined) {
            isPassed = obtainedMarks >= exam.totalPassMarks;
          } else {
            isPassed = percentage >= 40;
          }

          let grade: string | undefined =
                resultData.grade && resultData.grade !== 'N/A'
                    ? resultData.grade
                    : undefined;

                let gpa: number | undefined =
                resultData.gpa && resultData.gpa !== 'N/A'
                    ? parseFloat(resultData.gpa)
                    : undefined;

          
          if (exam.enableGrading && !grade) {
            if (exam.useGPASystem) {
              const calculatedGrade = this.calculateGrade(percentage);
              const calculatedGPA = this.calculateGPA(percentage);
              grade = calculatedGrade;
              gpa = calculatedGPA;
            } else {
              const calculatedGrade = this.calculateGrade(percentage);
              grade = calculatedGrade;
            }
          }

          // Determine result class
          const resultClass = this.determineResultClass(percentage);

          // Create result object
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

      // Save all results
      const savedResults = await Promise.all(resultsToSave);

      // Update positions
      await this.updatePositions(bulkCreateResultDto.exam_id, session);

      await session.commitTransaction();

      // Populate saved results for response
      const populatedResults = await this.resultModel
        .find({
          _id: { $in: savedResults.map(r => r._id) }
        })
        .populate('examDetails')
        .populate('studentDetails')
        .populate('classDetails')
        .populate('batchDetails')
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

      // Build filter
      if (search) {
        filter.$or = [
          { 'studentDetails.registrationId': { $regex: search, $options: 'i' } },
          { 'studentDetails.nameEnglish': { $regex: search, $options: 'i' } },
          { 'examDetails.examName': { $regex: search, $options: 'i' } },
          { grade: { $regex: search, $options: 'i' } },
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

      // Check if result exists
      const existingResult = await this.resultModel
        .findById(id)
        .populate('examDetails')
        .session(session)
        .exec();

      if (!existingResult) {
        throw new NotFoundException(`Result with ID ${id} not found`);
      }

      const exam = existingResult.examDetails as any;

      // Prepare update data
      const updateData: any = { ...updateResultDto };
      
      // Validate marks if updating
      if (updateResultDto.obtainedMarks !== undefined) {
        if (updateResultDto.obtainedMarks > existingResult.totalMarks) {
          throw new BadRequestException('Obtained marks cannot exceed total marks');
        }

        // Calculate percentage
        const percentage = (updateResultDto.obtainedMarks / existingResult.totalMarks) * 100;
        updateData.percentage = percentage;
        
        // Determine pass/fail
        let isPassed = false;
        if (updateResultDto.isAbsent) {
          isPassed = false;
        } else if (exam.enableGrading && exam.totalPassMarks !== undefined) {
          isPassed = updateResultDto.obtainedMarks >= exam.totalPassMarks;
        } else {
          isPassed = percentage >= 40;
        }
        updateData.isPassed = isPassed;

        // Calculate grade and GPA if enabled
        if (exam.enableGrading) {
          if (!updateResultDto.grade && exam.useGPASystem) {
            const calculatedGrade = this.calculateGrade(percentage);
            const calculatedGPA = this.calculateGPA(percentage);
            updateData.grade = calculatedGrade;
            updateData.gpa = calculatedGPA;
          } else if (!updateResultDto.grade) {
            const calculatedGrade = this.calculateGrade(percentage);
            updateData.grade = calculatedGrade;
          }
        }

        // Determine result class
        if (!updateResultDto.resultClass) {
          const resultClass = this.determineResultClass(percentage);
          updateData.resultClass = resultClass;
        }
      }
      
      // Add updatedBy if userId is provided
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
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      // Update positions if marks were changed
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
        limit = 100, // Higher limit for exam results
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

      // Get exam details
      const exam = await this.examModel.findById(examId).exec();
      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      // Get all results for this exam
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

      // Calculate statistics
      const presentResults = results.filter(r => !r.isAbsent);
      const passedResults = results.filter(r => r.isPassed);
      const failedResults = results.filter(r => !r.isPassed && !r.isAbsent);
      const absentResults = results.filter(r => r.isAbsent);

      const totalMarks = presentResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
      const averageMarks = presentResults.length > 0 ? totalMarks / presentResults.length : 0;
      const highestMarks = presentResults.length > 0 ? Math.max(...presentResults.map(r => r.obtainedMarks)) : 0;
      const lowestMarks = presentResults.length > 0 ? Math.min(...presentResults.map(r => r.obtainedMarks)) : 0;

      // Get top 5 performers
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

      // Calculate grade distribution
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

  // Helper methods
  private async updatePositions(examId: string, session?: ClientSession): Promise<void> {
    try {
      // Get all results for this exam, sorted by obtained marks (descending)
      const results = await this.resultModel
        .find({ exam: new Types.ObjectId(examId), isAbsent: false })
        .sort({ obtainedMarks: -1 })
        .session(session || null)
        .exec();

      // Update positions (handling ties)
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

      // Set position for absent students
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

  private calculateGrade(percentage: number): string {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }

  private calculateGPA(percentage: number): number {
    if (percentage >= 80) return 5.0;
    if (percentage >= 70) return 4.0;
    if (percentage >= 60) return 3.5;
    if (percentage >= 50) return 3.0;
    if (percentage >= 40) return 2.0;
    if (percentage >= 33) return 1.0;
    return 0.0;
  }

  private determineResultClass(percentage: number): string {
    if (percentage >= 80) return 'distinction';
    if (percentage >= 60) return 'first_class';
    if (percentage >= 45) return 'second_class';
    if (percentage >= 33) return 'third_class';
    return 'failed';
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

  // Get students for result entry (based on class and batch)
async getStudentsForResultEntry(classId: string, batchId: string): Promise<IStudentResult[]> {
  try {
    console.log('Querying for class:', classId, 'batch:', batchId);
    
    // Query for STRING values (not ObjectId)
    const students = await this.studentModel
      .find({
        class: classId,  // Query for string, not ObjectId
        batch: batchId,   // Query for string, not ObjectId
        isActive: true,
        status: 'active',
      })
      .lean()
      .sort({ registrationId: 1 })
      .exec();

    console.log('Query result count:',students, students.length);
    
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

  // Get results by creator (user)
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