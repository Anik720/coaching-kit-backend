import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './exam.schema';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ClassService } from 'src/AcademicFunction/class/class.service';
import { BatchService } from 'src/AcademicFunction/btach/batch.service';
import { SubjectService } from 'src/AcademicFunction/subject/subject.service';
import { ExamCategoryService } from '../exam category/exam-category.service';


@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    private readonly classService: ClassService,
    private readonly batchService: BatchService,
    private readonly subjectService: SubjectService,
    private readonly examCategoryService: ExamCategoryService,
  ) {}

  async validateReferences(dto: CreateExamDto | UpdateExamDto) {
    // Validate class exists
    if (dto.classId) {
      try {
        await this.classService.findOne(dto.classId);
      } catch (error) {
        throw new BadRequestException('Invalid class ID');
      }
    }

    // Validate batches exist
    if (dto.batchIds && dto.batchIds.length > 0) {
      for (const batchId of dto.batchIds) {
        try {
          await this.batchService.findOne(batchId);
        } catch (error) {
          throw new BadRequestException(`Invalid batch ID: ${batchId}`);
        }
      }
    }

    // Validate subject exists
    if (dto.subjectId) {
      try {
        await this.subjectService.findOne(dto.subjectId);
      } catch (error) {
        throw new BadRequestException('Invalid subject ID');
      }
    }

    // Validate exam category exists
    if (dto.examCategoryId) {
      try {
        await this.examCategoryService.findOne(dto.examCategoryId);
      } catch (error) {
        throw new BadRequestException('Invalid exam category ID');
      }
    }
  }

  async create(dto: CreateExamDto, userId: string) {
    console.log('=== Exam Creation Debug ===');
    console.log('Received userId:', userId);
    console.log('Is valid ObjectId?', Types.ObjectId.isValid(userId));
    
    if (!Types.ObjectId.isValid(userId)) {
      console.log('ERROR: Invalid user ID format');
      throw new BadRequestException('Invalid user ID');
    }

    // Validate references
    await this.validateReferences(dto);

    // Check for duplicate exam name within same class and subject
    const existingExam = await this.examModel.findOne({ 
      examName: dto.examName,
      class: new Types.ObjectId(dto.classId),
      subject: new Types.ObjectId(dto.subjectId)
    }).exec();

    if (existingExam) {
      console.log('ERROR: Duplicate exam name');
      throw new ConflictException('Exam with this name already exists for this class and subject');
    }

    // Validate mark titles total equals total marks if provided
    if (dto.markTitles && dto.markTitles.length > 0) {
      const markTitlesTotal = dto.markTitles.reduce((sum, title) => sum + title.marks, 0);
      if (markTitlesTotal !== dto.totalMarks) {
        throw new BadRequestException('Sum of mark titles must equal total marks');
      }
    }

    // Validate grades if grading is enabled
    if (dto.enableGrading) {
      if (!dto.grades || dto.grades.length === 0) {
        throw new BadRequestException('Grades configuration is required when grading is enabled');
      }
      
      // Validate pass marks percentage
      if (!dto.passMarksPercentage && dto.passMarksPercentage !== 0) {
        throw new BadRequestException('Pass marks percentage is required when grading is enabled');
      }

      // Validate grades cover 0-100%
      let minCoverage = 100;
      let maxCoverage = 0;
      
      for (const grade of dto.grades) {
        if (grade.minPercentage > grade.maxPercentage) {
          throw new BadRequestException(`Grade ${grade.grade}: minPercentage cannot be greater than maxPercentage`);
        }
        
        minCoverage = Math.min(minCoverage, grade.minPercentage);
        maxCoverage = Math.max(maxCoverage, grade.maxPercentage);
        
        // Check for grade overlaps (this would need more sophisticated validation)
      }
      
      if (minCoverage > 0 || maxCoverage < 100) {
        throw new BadRequestException('Grades must cover the entire percentage range from 0 to 100');
      }
    }

    const userObjectId = new Types.ObjectId(userId);
    console.log('Converted to ObjectId:', userObjectId);

    const newExam = new this.examModel({
      examName: dto.examName,
      topicName: dto.topicName,
      class: new Types.ObjectId(dto.classId),
      batches: dto.batchIds.map(id => new Types.ObjectId(id)),
      subject: new Types.ObjectId(dto.subjectId),
      examCategory: new Types.ObjectId(dto.examCategoryId),
      examDate: dto.examDate,
      showMarksTitle: dto.showMarksTitle || false,
      markTitles: dto.markTitles || [],
      totalMarks: dto.totalMarks,
      enableGrading: dto.enableGrading || false,
      passMarksPercentage: dto.passMarksPercentage,
      grades: dto.grades || [],
      instructions: dto.instructions,
      duration: dto.duration,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdBy: userObjectId
    });
    
    console.log('New exam data:', newExam);
    
    const savedExam = await newExam.save();
    console.log('Saved exam ID:', savedExam._id);
    
    // Populate references
    try {
      await savedExam.populate([
        { path: 'class', select: 'classname description' },
        { path: 'batches', select: 'batchName sessionYear' },
        { path: 'subject', select: 'subjectName subjectCode' },
        { path: 'examCategory', select: 'categoryName' },
        { path: 'createdBy', select: 'email username role' }
      ]);
      console.log('Populated exam:', savedExam);
    } catch (populateError) {
      console.error('Error populating exam:', populateError);
    }
    
    console.log('=== End Debug ===');
    return savedExam;
  }

  async findAll(query?: any) {
    const { 
      search, 
      isActive, 
      classId,
      subjectId,
      examCategoryId,
      batchId,
      fromDate,
      toDate,
      page = 1, 
      limit = 10, 
      sortBy = 'examDate', 
      sortOrder = 'desc' 
    } = query || {};
    
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { examName: { $regex: search, $options: 'i' } },
        { topicName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (classId && Types.ObjectId.isValid(classId)) {
      filter.class = new Types.ObjectId(classId);
    }

    if (subjectId && Types.ObjectId.isValid(subjectId)) {
      filter.subject = new Types.ObjectId(subjectId);
    }

    if (examCategoryId && Types.ObjectId.isValid(examCategoryId)) {
      filter.examCategory = new Types.ObjectId(examCategoryId);
    }

    if (batchId && Types.ObjectId.isValid(batchId)) {
      filter.batches = new Types.ObjectId(batchId);
    }

    if (fromDate || toDate) {
      filter.examDate = {};
      if (fromDate) {
        filter.examDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.examDate.$lte = new Date(toDate);
      }
    }
    
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [data, total] = await Promise.all([
      this.examModel
        .find(filter)
        .populate('class', 'classname description')
        .populate('batches', 'batchName sessionYear')
        .populate('subject', 'subjectName subjectCode')
        .populate('examCategory', 'categoryName')
        .populate('createdBy', 'email username role')
        .populate('updatedBy', 'email username role')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examModel.countDocuments(filter).exec(),
    ]);
    
    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const result = await this.examModel
      .findById(id)
      .populate('class', 'classname description isActive')
      .populate('batches', 'batchName sessionYear isActive')
      .populate('subject', 'subjectName subjectCode isActive')
      .populate('examCategory', 'categoryName isActive')
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();
    
    if (!result) throw new NotFoundException('Exam not found');
    return result;
  }

  async update(id: string, dto: UpdateExamDto, userId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    // Check if exam exists
    const existingExam = await this.examModel.findById(id).exec();
    if (!existingExam) {
      throw new NotFoundException('Exam not found');
    }

    // Validate references
    await this.validateReferences(dto);

    // Check for duplicate exam name if updating
    if (dto.examName) {
      const duplicateExam = await this.examModel.findOne({ 
        examName: dto.examName,
        class: dto.classId ? new Types.ObjectId(dto.classId) : existingExam.class,
        subject: dto.subjectId ? new Types.ObjectId(dto.subjectId) : existingExam.subject,
        _id: { $ne: id }
      }).exec();

      if (duplicateExam) {
        throw new ConflictException('Exam with this name already exists for this class and subject');
      }
    }

    // Validate mark titles if provided
    if (dto.markTitles && dto.markTitles.length > 0) {
      const totalMarks = dto.totalMarks || existingExam.totalMarks;
      const markTitlesTotal = dto.markTitles.reduce((sum, title) => sum + title.marks, 0);
      if (markTitlesTotal !== totalMarks) {
        throw new BadRequestException('Sum of mark titles must equal total marks');
      }
    }

    // Validate grades if grading is enabled or being enabled
    if (dto.enableGrading || (dto.enableGrading === undefined && existingExam.enableGrading)) {
      const grades = dto.grades || existingExam.grades;
      const passMarksPercentage = dto.passMarksPercentage !== undefined ? dto.passMarksPercentage : existingExam.passMarksPercentage;
      
      if (!grades || grades.length === 0) {
        throw new BadRequestException('Grades configuration is required when grading is enabled');
      }
      
      if (passMarksPercentage === undefined || passMarksPercentage === null) {
        throw new BadRequestException('Pass marks percentage is required when grading is enabled');
      }
    }

    const updateData: any = {};
    
    // Update fields if provided
    if (dto.examName !== undefined) updateData.examName = dto.examName;
    if (dto.topicName !== undefined) updateData.topicName = dto.topicName;
    if (dto.classId !== undefined) updateData.class = new Types.ObjectId(dto.classId);
    if (dto.batchIds !== undefined) updateData.batches = dto.batchIds.map(id => new Types.ObjectId(id));
    if (dto.subjectId !== undefined) updateData.subject = new Types.ObjectId(dto.subjectId);
    if (dto.examCategoryId !== undefined) updateData.examCategory = new Types.ObjectId(dto.examCategoryId);
    if (dto.examDate !== undefined) updateData.examDate = dto.examDate;
    if (dto.showMarksTitle !== undefined) updateData.showMarksTitle = dto.showMarksTitle;
    if (dto.markTitles !== undefined) updateData.markTitles = dto.markTitles;
    if (dto.totalMarks !== undefined) updateData.totalMarks = dto.totalMarks;
    if (dto.enableGrading !== undefined) updateData.enableGrading = dto.enableGrading;
    if (dto.passMarksPercentage !== undefined) updateData.passMarksPercentage = dto.passMarksPercentage;
    if (dto.grades !== undefined) updateData.grades = dto.grades;
    if (dto.instructions !== undefined) updateData.instructions = dto.instructions;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.examModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('class', 'classname description')
      .populate('batches', 'batchName sessionYear')
      .populate('subject', 'subjectName subjectCode')
      .populate('examCategory', 'categoryName')
      .populate('createdBy', 'email username role')
      .populate('updatedBy', 'email username role')
      .exec();

    if (!updated) throw new NotFoundException('Exam not found');

    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    // Check if exam has any results associated
    // You would need to implement this check based on your result schema
    // const hasResults = await this.resultModel.countDocuments({ exam: id }).exec();
    // if (hasResults > 0) {
    //   throw new ConflictException('Cannot delete exam because it has associated results');
    // }

    const deleted = await this.examModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'email username role')
      .exec();
    
    if (!deleted) throw new NotFoundException('Exam not found');

    return { 
      message: 'Exam deleted successfully',
      deletedExam: deleted 
    };
  }

  async getExamStats(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel
      .findById(id)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('examCategory', 'categoryName')
      .populate('batches', 'batchName')
      .exec();
    
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Get statistics (you would need to implement these based on your result schema)
    const stats = {
      totalStudents: 0,
      appearedStudents: 0,
      passCount: 0,
      failCount: 0,
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 0,
    };

    return {
      exam: {
        _id: exam._id,
        examName: exam.examName,
        topicName: exam.topicName,
        class: exam.class,
        subject: exam.subject,
        examCategory: exam.examCategory,
        batches: exam.batches,
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        enableGrading: exam.enableGrading,
        passMarksPercentage: exam.passMarksPercentage,
        isActive: exam.isActive,
      },
      statistics: stats,
    };
  }

  async toggleActive(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const exam = await this.examModel.findById(id).exec();
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Toggle active status
    exam.isActive = !exam.isActive;
    
    // Set the user who updated
    exam.updatedBy = new Types.ObjectId(userId);
    
    // Save the changes
    await exam.save();
    
    // Populate references
    await exam.populate([
      { path: 'class', select: 'classname' },
      { path: 'subject', select: 'subjectName' },
      { path: 'examCategory', select: 'categoryName' },
      { path: 'createdBy', select: 'email username role' },
      { path: 'updatedBy', select: 'email username role' }
    ]);

    return {
      _id: exam._id,
      examName: exam.examName,
      isActive: exam.isActive,
      class: exam.class,
      subject: exam.subject,
      examCategory: exam.examCategory,
      createdBy: exam.createdBy,
      updatedBy: exam.updatedBy,
      message: 'Exam status updated successfully',
    };
  }

  async getExamsByBatch(batchId: string, query?: any) {
    if (!Types.ObjectId.isValid(batchId)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const { 
      isActive, 
      upcomingOnly,
      fromDate,
      toDate,
      page = 1, 
      limit = 10, 
      sortBy = 'examDate', 
      sortOrder = 'asc' 
    } = query || {};
    
    const filter: any = { batches: new Types.ObjectId(batchId) };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (upcomingOnly) {
      filter.examDate = { $gte: new Date() };
    }

    if (fromDate || toDate) {
      filter.examDate = filter.examDate || {};
      if (fromDate) {
        filter.examDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.examDate.$lte = new Date(toDate);
      }
    }
    
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [data, total] = await Promise.all([
      this.examModel
        .find(filter)
        .populate('class', 'classname')
        .populate('subject', 'subjectName subjectCode')
        .populate('examCategory', 'categoryName')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getExamsByClass(classId: string, query?: any) {
    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    const { 
      isActive, 
      subjectId,
      upcomingOnly,
      page = 1, 
      limit = 10, 
      sortBy = 'examDate', 
      sortOrder = 'asc' 
    } = query || {};
    
    const filter: any = { class: new Types.ObjectId(classId) };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (subjectId && Types.ObjectId.isValid(subjectId)) {
      filter.subject = new Types.ObjectId(subjectId);
    }

    if (upcomingOnly) {
      filter.examDate = { $gte: new Date() };
    }
    
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [data, total] = await Promise.all([
      this.examModel
        .find(filter)
        .populate('subject', 'subjectName subjectCode')
        .populate('examCategory', 'categoryName')
        .populate('batches', 'batchName sessionYear')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.examModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Get upcoming exams for a student (based on their batches)
  async getUpcomingExamsForStudent(studentId: string, limit: number = 10) {
    // First get student's batches
    // This would depend on your student schema
    // For now, returning upcoming exams for all batches
    
    const filter = {
      examDate: { $gte: new Date() },
      isActive: true
    };
    
    return this.examModel
      .find(filter)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('examCategory', 'categoryName')
      .populate('batches', 'batchName')
      .sort({ examDate: 1 })
      .limit(limit)
      .exec();
  }

  // Count exams created by a user
  async countExamsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.examModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId) 
    }).exec();
  }

  // Count active exams by user
  async countActiveExamsByUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    
    return this.examModel.countDocuments({ 
      createdBy: new Types.ObjectId(userId),
      isActive: true 
    }).exec();
  }
}