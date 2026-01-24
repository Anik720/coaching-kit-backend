// combine-result.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { CreateCombineResultDto, SearchCombineResultDto } from './dto/create-combine-result.dto';
import { UpdateCombineResultDto } from './dto/update-combine-result.dto';
import { CombineResultResponseDto, CombineResultStudentResponseDto } from './dto/combine-result-response.dto';
import { Result, ResultDocument } from '../result/result.schema';
import { CombineResult, CombineResultDocument } from './combine-result.schema';
import { CombineResultStudent, CombineResultStudentDocument } from './combine-result-student.schema';
import { Student, StudentDocument } from '../../student/schemas/student.schema';
import { Class, ClassDocument } from 'src/AcademicFunction/class/class.schema';
import { Batch, BatchDocument } from 'src/AcademicFunction/btach/batch.schema';
import { Exam, ExamDocument } from '../create-exam/exam.schema';

@Injectable()
export class CombineResultService {
  constructor(
    @InjectModel(CombineResult.name)
    private combineResultModel: Model<CombineResultDocument>,

    @InjectModel(CombineResultStudent.name)
    private combineResultStudentModel: Model<CombineResultStudentDocument>,

    @InjectModel(Exam.name)
    private examModel: Model<ExamDocument>,

    @InjectModel(Student.name)
    private studentModel: Model<StudentDocument>,

    @InjectModel(Result.name)
    private resultModel: Model<ResultDocument>,

    @InjectModel(Class.name)
    private classModel: Model<ClassDocument>,

    @InjectModel(Batch.name)
    private batchModel: Model<BatchDocument>,
  ) {}

  // Helper method to safely get ObjectId as string
  private safeGetId(id: any): string {
    if (id instanceof Types.ObjectId) {
      return id.toString();
    }
    if (typeof id === 'string') {
      return id;
    }
    if (id && typeof id === 'object' && '_id' in id) {
      const objId = (id as any)._id;
      return this.safeGetId(objId);
    }
    return '';
  }

  // Helper method to safely get date
  private safeGetDate(date: any): Date {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date);
    }
    return new Date();
  }

  // Helper method to calculate grade and GPA based on percentage
  private calculateGradeAndGPA(percentage: number): { grade: string; gpa: number } {
    if (percentage >= 80) return { grade: 'A+', gpa: 5.0 };
    if (percentage >= 70) return { grade: 'A', gpa: 4.0 };
    if (percentage >= 60) return { grade: 'A-', gpa: 3.5 };
    if (percentage >= 50) return { grade: 'B', gpa: 3.0 };
    if (percentage >= 40) return { grade: 'C', gpa: 2.0 };
    if (percentage >= 33) return { grade: 'D', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  }

  // Helper method to determine result class
  private determineResultClass(percentage: number): string {
    if (percentage >= 80) return 'distinction';
    if (percentage >= 60) return 'first_class';
    if (percentage >= 45) return 'second_class';
    if (percentage >= 33) return 'third_class';
    return 'failed';
  }

  // Helper method to update student positions
  private async updateStudentPositions(
    combineResultId: string,
    session?: ClientSession,
  ): Promise<void> {
    try {
      const query = this.combineResultStudentModel
        .find({
          combineResult: new Types.ObjectId(combineResultId),
          isAbsent: false,
        })
        .sort({ obtainedMarks: -1 });

      if (session) query.session(session);

      const studentResults = await query.exec();

      let currentPosition = 1;
      let previousMarks: number | null = null;
      let sameRankCount = 0;

      for (const studentResult of studentResults) {
        if (previousMarks === null || studentResult.obtainedMarks < previousMarks) {
          currentPosition += sameRankCount;
          sameRankCount = 1;
        } else {
          sameRankCount++;
        }

        const updateQuery = this.combineResultStudentModel.findByIdAndUpdate(
          studentResult._id,
          { position: currentPosition },
          { new: true, session: session || undefined },
        );

        await updateQuery.exec();

        previousMarks = studentResult.obtainedMarks;
      }

      await this.combineResultStudentModel.updateMany(
        { combineResult: new Types.ObjectId(combineResultId), isAbsent: true },
        { position: 0 },
        { session: session || undefined },
      );
    } catch (error) {
      console.error('Update student positions error:', error);
      throw new InternalServerErrorException('Failed to update student positions');
    }
  }

  // Create combine result
  async create(
    createCombineResultDto: CreateCombineResultDto,
    userId: string,
  ): Promise<CombineResultResponseDto> {
    const session = await this.combineResultModel.db.startSession();
    session.startTransaction();

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const classId = createCombineResultDto.class;
      if (!Types.ObjectId.isValid(classId)) throw new BadRequestException('Invalid class ID');

      const batchIds = createCombineResultDto.batches;
      if (!Array.isArray(batchIds) || batchIds.length === 0) {
        throw new BadRequestException('At least one batch must be selected');
      }

      const examIds = createCombineResultDto.exams;
      if (!Array.isArray(examIds) || examIds.length === 0) {
        throw new BadRequestException('At least one exam must be selected');
      }

      // Existence checks
      const classExists = await this.classModel.findById(classId).session(session).exec();
      if (!classExists) throw new NotFoundException('Class not found');

      const batches = await this.batchModel
        .find({ _id: { $in: batchIds.map((id) => new Types.ObjectId(id)) } })
        .session(session)
        .exec();

      if (batches.length !== batchIds.length) {
        throw new NotFoundException('One or more batches not found');
      }

      const startDate = new Date(createCombineResultDto.startDate);
      const endDate = new Date(createCombineResultDto.endDate);

      const exams = await this.examModel
        .find({
          _id: { $in: examIds.map((id) => new Types.ObjectId(id)) },
          isActive: true,
          isPublished: true,
          examDate: { $gte: startDate, $lte: endDate },
        })
        .session(session)
        .exec();

      if (exams.length !== examIds.length) {
        throw new NotFoundException('One or more exams not found, inactive or not published');
      }

      // Calculate totals
      let totalMarks = 0;
      let mcqMarks = 0;
      let cqMarks = 0;
      let writtenMarks = 0;

      exams.forEach((exam: ExamDocument) => {
        totalMarks += exam.totalMarks ?? 0;
        mcqMarks += exam.mcqMarks ?? 0;
        cqMarks += exam.cqMarks ?? 0;
        writtenMarks += exam.writtenMarks ?? 0;
      });

      // Name uniqueness check
      const existing = await this.combineResultModel.findOne(
        {
          name: createCombineResultDto.name,
          class: new Types.ObjectId(classId),
        },
        null,
        { session },
      );

      if (existing) {
        throw new ConflictException('Combine result with this name already exists for this class');
      }

      // Create main document with proper typing
      const combineResultData = {
        name: createCombineResultDto.name,
        class: new Types.ObjectId(classId),
        batches: batchIds.map((id) => new Types.ObjectId(id)),
        exams: examIds.map((id) => new Types.ObjectId(id)),
        category: createCombineResultDto.category,
        startDate,
        endDate,
        totalMarks,
        mcqMarks,
        cqMarks,
        writtenMarks,
        createdBy: new Types.ObjectId(userId),
        isActive: true,
        isPublished: createCombineResultDto.isPublished ?? false,
      };

      const createdResults = await this.combineResultModel.create([combineResultData], { session });
      const savedCombineResult = createdResults[0] as CombineResultDocument;

      // Fetch students
      const students = await this.studentModel
        .find({
          class: new Types.ObjectId(classId),
          batch: { $in: batchIds.map((id) => new Types.ObjectId(id)) },
          isActive: true,
          status: 'active',
        })
        .session(session)
        .exec();

      if (students.length === 0) {
        throw new BadRequestException('No active students found in the selected batches');
      }

      // Create student result entries
      const studentResultPromises = students.map(async (student: StudentDocument) => {
        const examMarks = new Map<string, { totalMarks: number; obtainedMarks: number; isAbsent: boolean }>();
        let totalObtainedMarks = 0;
        let allAbsent = true;

        for (const exam of exams) {
          const examIdStr = this.safeGetId(exam._id);

          const result = await this.resultModel
            .findOne({
              exam: exam._id,
              student: student._id,
              isActive: true,
            })
            .session(session)
            .exec();

          if (result) {
            const data = {
              totalMarks: exam.totalMarks ?? 0,
              obtainedMarks: result.obtainedMarks ?? 0,
              isAbsent: result.isAbsent ?? false,
            };
            examMarks.set(examIdStr, data);

            if (!data.isAbsent) {
              totalObtainedMarks += data.obtainedMarks;
              allAbsent = false;
            }
          } else {
            examMarks.set(examIdStr, {
              totalMarks: exam.totalMarks ?? 0,
              obtainedMarks: 0,
              isAbsent: true,
            });
          }
        }

        const percentage =
          !allAbsent && totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;

        const { grade, gpa } = this.calculateGradeAndGPA(percentage);
        const resultClass = this.determineResultClass(percentage);
        const isPassed = grade !== 'F';

        const studentResultData = {
          combineResult: savedCombineResult._id,
          student: student._id,
          class: new Types.ObjectId(classId),
          batch: student.batch,
          examMarks,
          totalMarks,
          obtainedMarks: totalObtainedMarks,
          percentage,
          grade,
          gpa,
          isPassed,
          isAbsent: allAbsent,
          resultClass,
        };

        const createdStudentResults = await this.combineResultStudentModel.create([studentResultData], { session });
        return createdStudentResults[0] as CombineResultStudentDocument;
      });

      await Promise.all(studentResultPromises);

      await this.updateStudentPositions(this.safeGetId(savedCombineResult._id), session);

      await session.commitTransaction();

      // Final populated response
      const populated = await this.combineResultModel
        .findById(savedCombineResult._id)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks examCategory')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!populated) throw new NotFoundException('Failed to reload created combine result');

      return this.mapToResponseDto(populated);
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Create combine result error:', error);

      if (error.code === 11000) {
        throw new ConflictException('Combine result already exists');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create combine result');
    } finally {
      session.endSession();
    }
  }

  // Search exams for combine result creation
  async searchExamsForCombine(searchDto: SearchCombineResultDto): Promise<any[]> {
    try {
      const { class: classId, batches, category, startDate, endDate, status } = searchDto;

      const filter: any = { isActive: true };

      if (classId && Types.ObjectId.isValid(classId)) {
        filter.class = new Types.ObjectId(classId);
      }

      if (batches && Array.isArray(batches) && batches.length > 0) {
        const validBatchIds = batches.filter(id => Types.ObjectId.isValid(id));
        if (validBatchIds.length > 0) {
          filter.batch = { $in: validBatchIds.map(id => new Types.ObjectId(id)) };
        }
      }

      if (category) {
        filter.examCategory = category;
      }

      if (startDate) {
        filter.examDate = { $gte: new Date(startDate) };
      }

      if (endDate) {
        filter.examDate = { ...filter.examDate, $lte: new Date(endDate) };
      }

      if (status === 'published') {
        filter.isPublished = true;
      } else if (status === 'draft') {
        filter.isPublished = false;
      }

      const exams = await this.examModel
        .find(filter)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName')
        .sort({ examDate: -1, createdAt: -1 })
        .exec();

      return exams.map((exam: ExamDocument & { classDetails?: any; batchDetails?: any }) => {
        // Handle batch details - it might be single or array
        let batchDetailsArray: any[] = [];
        if (Array.isArray(exam.batchDetails)) {
          batchDetailsArray = exam.batchDetails;
        } else if (exam.batchDetails) {
          batchDetailsArray = [exam.batchDetails];
        }

        return {
          _id: this.safeGetId(exam._id),
          examName: exam.examName || '',
          class: {
            _id: exam.classDetails?._id ? this.safeGetId(exam.classDetails._id) : this.safeGetId(exam.class) || '',
            classname: exam.classDetails?.classname || exam.className || '',
          },
          batches: batchDetailsArray.map((batch: any) => ({
            _id: this.safeGetId(batch._id),
            batchName: batch.batchName || '',
          })),
          category: exam.examCategory || '',
          totalMarks: exam.totalMarks || 0,
          mcqMarks: exam.mcqMarks || 0,
          cqMarks: exam.cqMarks || 0,
          writtenMarks: exam.writtenMarks || 0,
          examDate: exam.examDate,
          isPublished: exam.isPublished || false,
          isActive: exam.isActive || false,
        };
      });
    } catch (error) {
      console.error('Search exams error:', error);
      throw new InternalServerErrorException('Failed to search exams');
    }
  }

  // Get all combine results with pagination
  async findAll(query?: any): Promise<{
    data: CombineResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        class: classId,
        category,
        isPublished,
        isActive,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query || {};

      const filter: any = {};

      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }

      if (classId && Types.ObjectId.isValid(classId)) {
        filter.class = new Types.ObjectId(classId);
      }

      if (category) {
        filter.category = category;
      }

      if (isPublished !== undefined) {
        filter.isPublished = isPublished === 'true' || isPublished === true;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(100, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.combineResultModel
          .find(filter)
          .populate('classDetails', 'classname')
          .populate('batchDetails', 'batchName sessionYear')
          .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks examCategory')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.combineResultModel.countDocuments(filter).exec(),
      ]);

      return {
        data: data.map(result => this.mapToResponseDto(result)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Find all combine results error:', error);
      throw new InternalServerErrorException('Failed to fetch combine results');
    }
  }

  // Get single combine result by ID
  async findOne(id: string): Promise<CombineResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      const result = await this.combineResultModel
        .findById(id)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks examCategory')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!result) {
        throw new NotFoundException(`Combine result with ID ${id} not found`);
      }

      return this.mapToResponseDto(result);
    } catch (error) {
      console.error('Find one combine result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch combine result');
    }
  }

  // Get student results for a combine result
  async getStudentResults(combineResultId: string, query?: any): Promise<{
    data: CombineResultStudentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (!Types.ObjectId.isValid(combineResultId)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      // Check if combine result exists
      const combineResult = await this.combineResultModel.findById(combineResultId).exec();
      if (!combineResult) {
        throw new NotFoundException('Combine result not found');
      }

      const {
        search,
        batch,
        isPassed,
        isAbsent,
        page = 1,
        limit = 100,
        sortBy = 'position',
        sortOrder = 'asc',
      } = query || {};

      const filter: any = { combineResult: new Types.ObjectId(combineResultId) };

      if (search) {
        filter.$or = [
          { 'studentDetails.registrationId': { $regex: search, $options: 'i' } },
          { 'studentDetails.nameEnglish': { $regex: search, $options: 'i' } },
          { 'studentDetails.nameBangla': { $regex: search, $options: 'i' } },
        ];
      }

      if (batch && Types.ObjectId.isValid(batch)) {
        filter.batch = new Types.ObjectId(batch);
      }

      if (isPassed !== undefined) {
        filter.isPassed = isPassed === 'true' || isPassed === true;
      }

      if (isAbsent !== undefined) {
        filter.isAbsent = isAbsent === 'true' || isAbsent === true;
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Math.min(500, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.combineResultStudentModel
          .find(filter)
          .populate('studentDetails', 'registrationId nameEnglish nameBangla')
          .populate('batchDetails', 'batchName')
          .populate('combineResultDetails', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .exec(),
        this.combineResultStudentModel.countDocuments(filter).exec(),
      ]);

      // Map exam marks from Map to object
      const mappedData: CombineResultStudentResponseDto[] = data.map((studentResult: CombineResultStudentDocument) => {
        const plainResult = studentResult.toObject();

        // Convert examMarks Map to object
        const examMarksObj: Record<string, {
          obtainedMarks: number;
          totalMarks: number;
          isAbsent: boolean;
        }> = {};
        
        if (plainResult.examMarks && plainResult.examMarks instanceof Map) {
          plainResult.examMarks.forEach((value: any, key: string) => {
            examMarksObj[key] = {
              obtainedMarks: value.obtainedMarks || 0,
              totalMarks: value.totalMarks || 0,
              isAbsent: value.isAbsent || false
            };
          });
        } else if (plainResult.examMarks && typeof plainResult.examMarks === 'object') {
          Object.entries(plainResult.examMarks).forEach(([key, value]: [string, any]) => {
            examMarksObj[key] = {
              obtainedMarks: value.obtainedMarks || 0,
              totalMarks: value.totalMarks || 0,
              isAbsent: value.isAbsent || false
            };
          });
        }

        const studentDetails = (studentResult as any).studentDetails;
        const batchDetails = (studentResult as any).batchDetails;

        return {
          _id: this.safeGetId(plainResult._id),
          combineResultId: this.safeGetId(plainResult.combineResult),
          student: {
            _id: this.safeGetId(studentDetails?._id || plainResult.student),
            registrationId: studentDetails?.registrationId || '',
            nameEnglish: studentDetails?.nameEnglish || '',
            nameBangla: studentDetails?.nameBangla || undefined,
          },
          batch: {
            _id: this.safeGetId(batchDetails?._id || plainResult.batch),
            batchName: batchDetails?.batchName || '',
          },
          examMarks: examMarksObj,
          totalMarks: plainResult.totalMarks || 0,
          obtainedMarks: plainResult.obtainedMarks || 0,
          percentage: plainResult.percentage || 0,
          grade: plainResult.grade || '',
          gpa: plainResult.gpa || 0,
          position: plainResult.position || 0,
          isPassed: plainResult.isPassed || false,
          isAbsent: plainResult.isAbsent || false,
          resultClass: plainResult.resultClass || '',
          createdAt: this.safeGetDate(plainResult.createdAt),
          updatedAt: this.safeGetDate(plainResult.updatedAt),
        };
      });

      return {
        data: mappedData,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('Get student results error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch student results');
    }
  }

  // Update combine result
  async update(id: string, updateDto: UpdateCombineResultDto, userId: string): Promise<CombineResultResponseDto> {
    const session = await this.combineResultModel.db.startSession();
    session.startTransaction();

    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if combine result exists
      const existingResult = await this.combineResultModel.findById(id).session(session).exec();
      if (!existingResult) {
        throw new NotFoundException(`Combine result with ID ${id} not found`);
      }

      // Check for duplicate name if updating
      if (updateDto.name && updateDto.name !== existingResult.name) {
        const duplicate = await this.combineResultModel.findOne({
          name: updateDto.name,
          class: existingResult.class,
          _id: { $ne: new Types.ObjectId(id) },
        }).session(session).exec();

        if (duplicate) {
          throw new ConflictException('Combine result with this name already exists for this class');
        }
      }

      // Prepare update data
      const updateData: any = { ...updateDto };
      updateData.updatedBy = new Types.ObjectId(userId);

      // If exams are updated, we need to recalculate student results
      if (updateDto.exams && Array.isArray(updateDto.exams) && updateDto.exams.length > 0) {
        // Validate new exams
        const validExamIds = updateDto.exams.filter(examId => Types.ObjectId.isValid(examId));
        if (validExamIds.length === 0) {
          throw new BadRequestException('No valid exam IDs provided');
        }

        const exams = await this.examModel
          .find({ _id: { $in: validExamIds.map(id => new Types.ObjectId(id)) } })
          .session(session)
          .exec();

        if (exams.length !== validExamIds.length) {
          throw new NotFoundException('One or more exams not found');
        }

        // Calculate new total marks
        let totalMarks = 0;
        let mcqMarks = 0;
        let cqMarks = 0;
        let writtenMarks = 0;

        exams.forEach((exam: ExamDocument) => {
          totalMarks += exam.totalMarks || 0;
          mcqMarks += exam.mcqMarks || 0;
          cqMarks += exam.cqMarks || 0;
          writtenMarks += exam.writtenMarks || 0;
        });

        updateData.totalMarks = totalMarks;
        updateData.mcqMarks = mcqMarks;
        updateData.cqMarks = cqMarks;
        updateData.writtenMarks = writtenMarks;
        updateData.exams = validExamIds.map(id => new Types.ObjectId(id));
      }

      const updatedResult = await this.combineResultModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks examCategory')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!updatedResult) {
        throw new NotFoundException('Combine result not found after update');
      }

      await session.commitTransaction();

      return this.mapToResponseDto(updatedResult);
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Update combine result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update combine result');
    } finally {
      session.endSession();
    }
  }

  // Delete combine result
  async remove(id: string): Promise<void> {
    const session = await this.combineResultModel.db.startSession();
    session.startTransaction();

    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      // Delete combine result and all associated student results
      const [deletedResult] = await Promise.all([
        this.combineResultModel.findByIdAndDelete(id).session(session).exec(),
        this.combineResultStudentModel.deleteMany({ combineResult: new Types.ObjectId(id) }).session(session).exec(),
      ]);

      if (!deletedResult) {
        throw new NotFoundException(`Combine result with ID ${id} not found`);
      }

      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Delete combine result error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete combine result');
    } finally {
      session.endSession();
    }
  }

  // Toggle publish status
  async togglePublish(id: string, userId: string): Promise<CombineResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const result = await this.combineResultModel.findById(id).exec();
      if (!result) {
        throw new NotFoundException('Combine result not found');
      }

      result.isPublished = !result.isPublished;
      result.updatedBy = new Types.ObjectId(userId);
      
      await result.save();
      
      const populatedResult = await this.combineResultModel
        .findById(result._id)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks examCategory')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!populatedResult) {
        throw new NotFoundException('Combine result not found after update');
      }
      
      return this.mapToResponseDto(populatedResult);
    } catch (error) {
      console.error('Toggle publish error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to toggle publish status');
    }
  }

  // Toggle active status
  async toggleActive(id: string, userId: string): Promise<CombineResultResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const result = await this.combineResultModel.findById(id).exec();
      if (!result) {
        throw new NotFoundException('Combine result not found');
      }

      result.isActive = !result.isActive;
      result.updatedBy = new Types.ObjectId(userId);
      
      await result.save();
      
      const populatedResult = await this.combineResultModel
        .findById(result._id)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks examCategory')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!populatedResult) {
        throw new NotFoundException('Combine result not found after update');
      }
      
      return this.mapToResponseDto(populatedResult);
    } catch (error) {
      console.error('Toggle active error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to toggle active status');
    }
  }

  // Get combine result statistics
  async getStatistics(combineResultId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(combineResultId)) {
        throw new BadRequestException('Invalid combine result ID');
      }

      const combineResult = await this.combineResultModel
        .findById(combineResultId)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName')
        .exec();

      if (!combineResult) {
        throw new NotFoundException('Combine result not found');
      }

      // Get all student results
      const studentResults = await this.combineResultStudentModel
        .find({ combineResult: new Types.ObjectId(combineResultId) })
        .populate('studentDetails', 'registrationId nameEnglish')
        .populate('batchDetails', 'batchName')
        .sort({ position: 1 })
        .exec();

      if (studentResults.length === 0) {
        return {
          combineResult: {
            _id: this.safeGetId(combineResult._id),
            name: combineResult.name,
            class: (combineResult as any).classDetails,
            batches: (combineResult as any).batchDetails,
            totalMarks: combineResult.totalMarks,
            totalStudents: 0,
            statistics: {
              totalStudents: 0,
              presentStudents: 0,
              passedStudents: 0,
              failedStudents: 0,
              absentStudents: 0,
              averagePercentage: 0,
              highestMarks: 0,
              lowestMarks: 0,
            },
            topPerformers: [],
            batchWiseStats: {},
          },
        };
      }

      // Calculate statistics
      const presentResults = studentResults.filter(r => !r.isAbsent);
      const passedResults = studentResults.filter(r => r.isPassed);
      const failedResults = studentResults.filter(r => !r.isPassed && !r.isAbsent);
      const absentResults = studentResults.filter(r => r.isAbsent);

      const totalPercentage = presentResults.reduce((sum, r) => sum + r.percentage, 0);
      const averagePercentage = presentResults.length > 0 ? totalPercentage / presentResults.length : 0;
      const highestMarks = presentResults.length > 0 ? Math.max(...presentResults.map(r => r.obtainedMarks)) : 0;
      const lowestMarks = presentResults.length > 0 ? Math.min(...presentResults.map(r => r.obtainedMarks)) : 0;

      // Get top 10 performers
      const topPerformers = studentResults
        .slice(0, 10)
        .map((result, index) => {
          const student = (result as any).studentDetails as any;
          return {
            position: index + 1,
            studentId: this.safeGetId(student?._id || result.student),
            registrationId: student?.registrationId || '',
            name: student?.nameEnglish || '',
            batch: ((result as any).batchDetails as any)?.batchName || '',
            marks: result.obtainedMarks,
            percentage: result.percentage,
            grade: result.grade,
            gpa: result.gpa,
            isPassed: result.isPassed,
          };
        });

      // Batch-wise statistics
      const batchWiseStats: Record<string, any> = {};
      const batchGroups = studentResults.reduce((acc: Record<string, any>, result) => {
        const batchId = this.safeGetId(result.batch);
        if (!acc[batchId]) {
          acc[batchId] = {
            batchId,
            batchName: ((result as any).batchDetails as any)?.batchName || '',
            students: [],
          };
        }
        acc[batchId].students.push(result);
        return acc;
      }, {} as Record<string, any>);

      Object.values(batchGroups).forEach((batch: any) => {
        const present = batch.students.filter((s: any) => !s.isAbsent);
        const passed = batch.students.filter((s: any) => s.isPassed);
        const avgPercentage = present.length > 0 
          ? present.reduce((sum: number, s: any) => sum + s.percentage, 0) / present.length 
          : 0;

        batchWiseStats[batch.batchId] = {
          batchName: batch.batchName,
          totalStudents: batch.students.length,
          presentStudents: present.length,
          passedStudents: passed.length,
          failedStudents: present.length - passed.length,
          absentStudents: batch.students.length - present.length,
          averagePercentage: avgPercentage,
          topStudent: present.length > 0 
            ? present.sort((a: any, b: any) => b.obtainedMarks - a.obtainedMarks)[0]
            : null,
        };
      });

      return {
        combineResult: {
          _id: this.safeGetId(combineResult._id),
          name: combineResult.name,
          class: (combineResult as any).classDetails,
          batches: (combineResult as any).batchDetails,
          totalMarks: combineResult.totalMarks,
          totalStudents: studentResults.length,
          statistics: {
            totalStudents: studentResults.length,
            presentStudents: presentResults.length,
            passedStudents: passedResults.length,
            failedStudents: failedResults.length,
            absentStudents: absentResults.length,
            averagePercentage,
            highestMarks,
            lowestMarks,
            passPercentage: studentResults.length > 0 
              ? (passedResults.length / studentResults.length) * 100 
              : 0,
          },
          topPerformers,
          batchWiseStats,
        },
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get combine result statistics');
    }
  }

  // Helper method to map document to response DTO
  private mapToResponseDto(result: CombineResultDocument): CombineResultResponseDto {
    if (!result) {
      throw new BadRequestException('Invalid combine result document');
    }

    try {
      const classDetails = (result as any).classDetails as any;
      const batchDetails = (result as any).batchDetails as any[] || [];
      const examDetails = (result as any).examDetails as any[] || [];
      const createdByUser = (result as any).createdByUser as any;
      const updatedByUser = (result as any).updatedByUser as any;

      const response: CombineResultResponseDto = {
        _id: this.safeGetId(result._id),
        name: result.name,
        class: {
          _id: this.safeGetId(classDetails?._id || result.class),
          classname: classDetails?.classname || '',
        },
        batches: batchDetails.map((batch: any) => ({
          _id: this.safeGetId(batch._id),
          batchName: batch.batchName || '',
          sessionYear: batch.sessionYear || '',
        })),
        exams: examDetails.map((exam: any) => ({
          _id: this.safeGetId(exam._id),
          examName: exam.examName || '',
          totalMarks: exam.totalMarks || 0,
          mcqMarks: exam.mcqMarks || 0,
          cqMarks: exam.cqMarks || 0,
          writtenMarks: exam.writtenMarks || 0,
          category: exam.examCategory || exam.category || '',
        })),
        category: result.category,
        startDate: result.startDate,
        endDate: result.endDate,
        totalMarks: result.totalMarks || 0,
        mcqMarks: result.mcqMarks || 0,
        cqMarks: result.cqMarks || 0,
        writtenMarks: result.writtenMarks || 0,
        isActive: result.isActive,
        isPublished: result.isPublished,
        createdBy: {
          _id: this.safeGetId(createdByUser?._id || result.createdBy),
          email: createdByUser?.email || '',
          username: createdByUser?.username || '',
          role: createdByUser?.role || '',
        },
        // createdAt: result.createdAt,
        // updatedAt: result.updatedAt,
      };

      // Add updatedBy if exists
      if (updatedByUser || result.updatedBy) {
        response.updatedBy = {
          _id: this.safeGetId(updatedByUser?._id || result.updatedBy),
          email: updatedByUser?.email || '',
          username: updatedByUser?.username || '',
          role: updatedByUser?.role || '',
        };
      }

      return response;
    } catch (error) {
      console.error('Error mapping combine result to response DTO:', error, result);
      throw new InternalServerErrorException('Error processing combine result data');
    }
  }
}