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
import { ExamCategory, ExamCategoryDocument } from '../exam category/exam-category.schema';

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

    @InjectModel(ExamCategory.name)
    private examCategoryModel: Model<ExamCategoryDocument>,
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
    // Handle null/undefined
    if (id === null || id === undefined) {
      return '';
    }
    // As a last resort, try to convert to string
    return String(id);
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

  // Get active exam categories
  async getExamCategories(): Promise<any[]> {
    try {
      const categories = await this.examCategoryModel
        .find({ isActive: true })
        .sort({ categoryName: 1 })
        .exec();

      return categories.map((category: ExamCategoryDocument) => ({
        _id: this.safeGetId(category._id),
        categoryName: category.categoryName,
        description: category.description || '',
        isActive: category.isActive,
      }));
    } catch (error) {
      console.error('Get exam categories error:', error);
      throw new InternalServerErrorException('Failed to fetch exam categories');
    }
  }

  // Create combine result
  async create(
    createCombineResultDto: CreateCombineResultDto,
    userId: string,
  ): Promise<CombineResultResponseDto> {
    console.log('🚀 Starting create combine result process');
    console.log('📝 Received DTO:', JSON.stringify(createCombineResultDto, null, 2));
    console.log('👤 User ID:', userId);

    const session = await this.combineResultModel.db.startSession();
    session.startTransaction();

    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate class ID
      const classId = createCombineResultDto.class;
      console.log('🏫 Class ID:', classId);
      if (!Types.ObjectId.isValid(classId)) {
        throw new BadRequestException('Invalid class ID format');
      }

      // Validate batch IDs
      const batchIds = createCombineResultDto.batches;
      console.log('📚 Batch IDs:', batchIds);
      if (!Array.isArray(batchIds) || batchIds.length === 0) {
        throw new BadRequestException('At least one batch must be selected');
      }

      // Validate exam IDs
      const examIds = createCombineResultDto.exams;
      console.log('📝 Exam IDs:', examIds);
      if (!Array.isArray(examIds) || examIds.length === 0) {
        throw new BadRequestException('At least one exam must be selected');
      }

      // Validate category ID
      const categoryId = createCombineResultDto.category;
      console.log('🏷️ Category ID:', categoryId);
      console.log('✅ Is valid ObjectId?', Types.ObjectId.isValid(categoryId));
      
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException(`Invalid category ID format: ${categoryId}`);
      }

      // =================== EXISTENCE CHECKS ===================
      console.log('\n🔍 Starting existence checks...');

      // Check class existence
      const classExists = await this.classModel.findById(classId).session(session).exec();
      if (!classExists) {
        console.log('❌ Class not found:', classId);
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }
      console.log('✅ Class found:', classExists.classname);

      // Check batches existence
      const batchObjectIds = batchIds.map(id => new Types.ObjectId(id));
      const batches = await this.batchModel
        .find({ 
          _id: { $in: batchObjectIds },
          isActive: true 
        })
        .session(session)
        .exec();

      console.log('📊 Found batches:', batches.length, 'Expected:', batchIds.length);
      
      if (batches.length !== batchIds.length) {
        const foundIds = batches.map(b => this.safeGetId(b._id));
        const missingIds = batchIds.filter(id => !foundIds.includes(id));
        console.log('❌ Missing batch IDs:', missingIds);
        throw new NotFoundException(`Batches not found or inactive: ${missingIds.join(', ')}`);
      }
      console.log('✅ All batches found and active');

      // Check category existence
      console.log('🔎 Looking for category with ID:', categoryId);
      const category = await this.examCategoryModel
        .findById(categoryId)
        .session(session)
        .exec();
      
      if (!category) {
        console.log('❌ Category not found with ID:', categoryId);
        console.log('ℹ️ Available categories in DB:');
        const allCategories = await this.examCategoryModel.find({}).session(session).exec();
        console.log(allCategories.map(c => ({ id: this.safeGetId(c._id), name: c.categoryName, active: c.isActive })));
        throw new NotFoundException(`Exam category with ID ${categoryId} not found`);
      }
      
      console.log('✅ Category found:', {
        id: this.safeGetId(category._id),
        name: category.categoryName,
        active: category.isActive
      });

      if (!category.isActive) {
        console.log('❌ Category is not active');
        throw new BadRequestException('Exam category is not active');
      }

      // Parse dates
      const startDate = new Date(createCombineResultDto.startDate);
      const endDate = new Date(createCombineResultDto.endDate);
      console.log('📅 Date range:', startDate.toISOString(), 'to', endDate.toISOString());

      // Check exams existence
      const examObjectIds = examIds.map(id => new Types.ObjectId(id));
      const exams = await this.examModel
        .find({
          _id: { $in: examObjectIds },
          isActive: true,
          isPublished: true,
          examDate: { $gte: startDate, $lte: endDate },
        })
        .session(session)
        .exec();

      console.log('📊 Found exams:', exams.length, 'Expected:', examIds.length);
      
      if (exams.length !== examIds.length) {
        const foundExamIds = exams.map(e => this.safeGetId(e._id));
        const missingExamIds = examIds.filter(id => !foundExamIds.includes(id));
        
        // Detailed debugging for missing exams
        console.log('❌ Missing exam IDs:', missingExamIds);
        for (const missingId of missingExamIds) {
          const examCheck = await this.examModel
            .findById(missingId)
            .session(session)
            .exec();
          if (examCheck) {
            console.log(`ℹ️ Exam ${missingId} exists but:`, {
              isActive: examCheck.isActive,
              isPublished: examCheck.isPublished,
              examDate: examCheck.examDate,
              inRange: examCheck.examDate >= startDate && examCheck.examDate <= endDate
            });
          } else {
            console.log(`ℹ️ Exam ${missingId} does not exist in database`);
          }
        }
        
        throw new NotFoundException(`One or more exams not found, inactive, not published, or outside date range: ${missingExamIds.join(', ')}`);
      }
      console.log('✅ All exams found and valid');

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

      console.log('📊 Calculated totals:', {
        totalMarks,
        mcqMarks,
        cqMarks,
        writtenMarks
      });

      // Name uniqueness check
      const existingCombineResult = await this.combineResultModel.findOne(
        {
          name: createCombineResultDto.name,
          class: new Types.ObjectId(classId),
          category: new Types.ObjectId(categoryId),
        },
        null,
        { session },
      );

      if (existingCombineResult) {
        console.log('❌ Combine result with same name already exists');
        throw new ConflictException('Combine result with this name already exists for this class and category');
      }
      console.log('✅ Name is unique');

      // =================== CREATE MAIN DOCUMENT ===================
      console.log('\n📄 Creating combine result document...');
      
      const combineResultData = {
        name: createCombineResultDto.name,
        class: new Types.ObjectId(classId),
        batches: batchObjectIds,
        exams: examObjectIds,
        category: new Types.ObjectId(categoryId),
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

      console.log('📋 Combine result data:', combineResultData);

      const createdResults = await this.combineResultModel.create([combineResultData], { session });
      const savedCombineResult = createdResults[0] as CombineResultDocument;
      const savedCombineResultId = this.safeGetId(savedCombineResult._id);
      console.log('✅ Combine result created with ID:', savedCombineResultId);

      // =================== FETCH STUDENTS ===================
      console.log('\n👥 Fetching students...');
      
      // IMPORTANT: Your student schema shows class and batch are Types.ObjectId references
      // But the data you provided shows nested objects. Let's handle both cases
      
            // First, let's debug what the actual student data looks like
      const students = await this.studentModel
        .find({
          class: classId, // String comparison, not ObjectId
          batch: { $in: batchIds }, // String comparison, not ObjectId
          isActive: true,
          status: 'active',
        })
        .session(session)
        .exec();

      console.log('📊 Found students:', students.length);
      console.log('📋 Students found:', students.map(s => ({
        id: this.safeGetId(s._id),
        name: s.nameEnglish,
        class: s.class,
        batch: s.batch,
        classType: typeof s.class,
        batchType: typeof s.batch
      })));

      if (students.length === 0) {
        console.log('❌ No active students found');
        throw new BadRequestException('No active students found in the selected batches');
      }

      console.log('📋 Students found:', students.map(s => ({
        id: this.safeGetId(s._id),
        name: s.nameEnglish,
        class: this.safeGetId(s.class),
        batch: this.safeGetId(s.batch)
      })));

      // =================== CREATE STUDENT RESULT ENTRIES ===================
      console.log('\n📝 Creating student result entries...');
      
      const studentResultPromises = students.map(async (student: StudentDocument) => {
        const examMarks = new Map<string, { totalMarks: number; obtainedMarks: number; isAbsent: boolean }>();
        let totalObtainedMarks = 0;
        let allAbsent = true;

        // Fetch results for each exam
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

        // Calculate percentage
        const percentage = !allAbsent && totalMarks > 0 
          ? (totalObtainedMarks / totalMarks) * 100 
          : 0;

        // Calculate grade, GPA, and result class
        const { grade, gpa } = this.calculateGradeAndGPA(percentage);
        const resultClass = this.determineResultClass(percentage);
        const isPassed = grade !== 'F';

        // Get student's class and batch IDs correctly
        const studentClassId = student.class instanceof Types.ObjectId 
          ? student.class 
          : new Types.ObjectId(this.safeGetId((student.class as any)?._id || student.class));
        
        const studentBatchId = student.batch instanceof Types.ObjectId 
          ? student.batch 
          : new Types.ObjectId(this.safeGetId((student.batch as any)?._id || student.batch));

        // Create student result data
        const studentResultData = {
          combineResult: savedCombineResult._id,
          student: student._id,
          class: studentClassId,
          batch: studentBatchId,
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
      console.log('✅ Student results created');

      // =================== UPDATE STUDENT POSITIONS ===================
      console.log('\n🥇 Updating student positions...');
      await this.updateStudentPositions(savedCombineResultId, session);
      console.log('✅ Student positions updated');

      // =================== COMMIT TRANSACTION ===================
      console.log('\n💾 Committing transaction...');
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');

      // =================== FETCH POPULATED RESPONSE ===================
      console.log('\n🔍 Fetching populated response...');
      
      const populated = await this.combineResultModel
        .findById(savedCombineResult._id)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks')
        .populate('categoryDetails', 'categoryName description')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .exec();

      if (!populated) {
        console.log('❌ Failed to reload created combine result');
        throw new NotFoundException('Failed to reload created combine result');
      }

      console.log('✅ Combine result creation completed successfully!');
      return this.mapToResponseDto(populated);

    } catch (error: any) {
      console.error('\n❌ ERROR in create combine result:', error.message);
      console.error('Stack trace:', error.stack);
      
      await session.abortTransaction();
      
      // Handle specific error types
      if (error.code === 11000) {
        console.error('Duplicate key error:', error.keyValue);
        throw new ConflictException('Combine result already exists');
      }
      
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        console.error('Known error type:', error.constructor.name);
        throw error;
      }

      console.error('Unknown error type, throwing InternalServerError');
      throw new InternalServerErrorException(`Failed to create combine result: ${error.message}`);
    } finally {
      console.log('🔚 Ending session');
      session.endSession();
    }
  }

  // Search exams for combine result creation
  async searchExamsForCombine(searchDto: SearchCombineResultDto): Promise<any[]> {
    try {
      console.log('🔍 Searching exams with criteria:', searchDto);
      
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

      if (category && Types.ObjectId.isValid(category)) {
        filter.examCategory = new Types.ObjectId(category);
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

      console.log('🔎 MongoDB filter:', filter);

      const exams = await this.examModel
        .find(filter)
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName')
        .populate('examCategoryDetails', 'categoryName')
        .sort({ examDate: -1, createdAt: -1 })
        .exec();

      console.log(`✅ Found ${exams.length} exams`);

      return exams.map((exam: ExamDocument & { classDetails?: any; batchDetails?: any; examCategoryDetails?: any }) => {
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
          category: {
            _id: exam.examCategoryDetails?._id ? this.safeGetId(exam.examCategoryDetails._id) : this.safeGetId(exam.examCategory) || '',
            categoryName: exam.examCategoryDetails?.categoryName || '',
          },
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
      console.error('❌ Search exams error:', error);
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

      if (category && Types.ObjectId.isValid(category)) {
        filter.category = new Types.ObjectId(category);
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
          .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks')
          .populate('categoryDetails', 'categoryName description')
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
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks')
        .populate('categoryDetails', 'categoryName description')
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
          category: updateDto.category ? new Types.ObjectId(updateDto.category) : existingResult.category,
          _id: { $ne: new Types.ObjectId(id) },
        }).session(session).exec();

        if (duplicate) {
          throw new ConflictException('Combine result with this name already exists for this class and category');
        }
      }

      // Prepare update data
      const updateData: any = { ...updateDto };
      updateData.updatedBy = new Types.ObjectId(userId);

      // If exams are updated, recalculate student results
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

      // If category is updated, validate the category
      if (updateDto.category && Types.ObjectId.isValid(updateDto.category)) {
        const category = await this.examCategoryModel
          .findById(updateDto.category)
          .session(session)
          .exec();
        
        if (!category) {
          throw new NotFoundException('Exam category not found');
        }

        if (!category.isActive) {
          throw new BadRequestException('Exam category is not active');
        }

        updateData.category = new Types.ObjectId(updateDto.category);
      }

      const updatedResult = await this.combineResultModel
        .findByIdAndUpdate(id, updateData, { new: true, session })
        .populate('classDetails', 'classname')
        .populate('batchDetails', 'batchName sessionYear')
        .populate('examDetails', 'examName totalMarks mcqMarks cqMarks writtenMarks')
        .populate('categoryDetails', 'categoryName description')
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
        .populate('examDetails', 'examName totalMarks')
        .populate('categoryDetails', 'categoryName')
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
        .populate('examDetails', 'examName totalMarks')
        .populate('categoryDetails', 'categoryName')
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
        .populate('categoryDetails', 'categoryName')
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
            category: (combineResult as any).categoryDetails,
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
          category: (combineResult as any).categoryDetails,
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
      const categoryDetails = (result as any).categoryDetails as any;
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
          // Each exam now has its own populated category
          category: {
            _id: this.safeGetId(exam.examCategory?._id || exam.examCategory),
            categoryName: exam.examCategory?.categoryName || '',
          },
        })),
        category: {
          _id: this.safeGetId(categoryDetails?._id || result.category),
          categoryName: categoryDetails?.categoryName || '',
        },
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
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
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