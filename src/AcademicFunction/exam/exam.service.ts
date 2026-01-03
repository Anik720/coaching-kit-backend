import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';
import { IExamStats } from './interfaces/exam.interface';
import { Exam, ExamDocument, ExamStatus } from './exam.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
  ) {}

  async create(createExamDto: CreateExamDto, userId: string): Promise<Exam> {
    try {
      // Validate dates
      const startTime = new Date(createExamDto.startTime);
      const endTime = new Date(createExamDto.endTime);
      const examDate = new Date(createExamDto.examDate);

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      // Check for overlapping exams for the same batches
      const overlappingExam = await this.examModel.findOne({
        batches: { $in: createExamDto.batches.map(id => new Types.ObjectId(id)) },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
        status: { $ne: ExamStatus.CANCELLED },
      });

      if (overlappingExam) {
        throw new ConflictException('Exam overlaps with existing exam for selected batches');
      }

      // Auto-calculate total marks from distribution if provided
      let totalMarks = createExamDto.totalMarks || 0;
      if (createExamDto.marksDistribution && createExamDto.marksDistribution.length > 0) {
        totalMarks = createExamDto.marksDistribution.reduce(
          (sum, item) => sum + item.marks,
          0,
        );
      }

      // Determine initial status based on exam date
      const now = new Date();
      let status = ExamStatus.DRAFT;
      if (examDate > now) {
        status = ExamStatus.SCHEDULED;
      } else if (startTime <= now && endTime >= now) {
        status = ExamStatus.ONGOING;
      } else if (endTime < now) {
        status = ExamStatus.COMPLETED;
      }

      const exam = new this.examModel({
        ...createExamDto,
        totalMarks,
        status,
        class: new Types.ObjectId(createExamDto.class),
        subject: new Types.ObjectId(createExamDto.subject),
        batches: createExamDto.batches.map(id => new Types.ObjectId(id)),
        createdBy: new Types.ObjectId(userId),
      });

      return await exam.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Exam with similar configuration already exists');
      }
      throw error;
    }
  }

  async findAll(query: ExamQueryDto): Promise<{
    data: Exam[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      class: classId,
      subject,
      batch,
      category,
      status,
      isActive,
      dateFrom,
      dateTo,
      createdBy,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Build filter
    if (search) {
      filter.$or = [
        { examName: { $regex: search, $options: 'i' } },
        { instructions: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (classId) {
      filter.class = new Types.ObjectId(classId);
    }

    if (subject) {
      filter.subject = new Types.ObjectId(subject);
    }

    if (batch) {
      filter.batches = new Types.ObjectId(batch);
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (dateFrom || dateTo) {
      filter.examDate = {};
      if (dateFrom) {
        filter.examDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.examDate.$lte = new Date(dateTo);
      }
    }

    if (createdBy) {
      filter.createdBy = new Types.ObjectId(createdBy);
    }

    // Get total count
    const total = await this.examModel.countDocuments(filter);

    // Build query with population
    const examQuery = this.examModel
      .find(filter)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .populate({
        path: 'updatedBy',
        select: 'username email firstName lastName',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const data = await examQuery.exec();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel
      .findById(id)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .populate({
        path: 'updatedBy',
        select: 'username email firstName lastName',
      })
      .exec();

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto, userId?: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    // Check if exam exists
    const existingExam = await this.examModel.findById(id);
    if (!existingExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    // Validate dates if provided
    if (updateExamDto.startTime || updateExamDto.endTime) {
      const startTime = updateExamDto.startTime 
        ? new Date(updateExamDto.startTime)
        : existingExam.startTime;
      const endTime = updateExamDto.endTime
        ? new Date(updateExamDto.endTime)
        : existingExam.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    // Check for overlapping exams if dates or batches are being updated
    if (updateExamDto.batches || updateExamDto.startTime || updateExamDto.endTime) {
      const batches = updateExamDto.batches 
        ? updateExamDto.batches.map(id => new Types.ObjectId(id))
        : existingExam.batches;
      const startTime = updateExamDto.startTime
        ? new Date(updateExamDto.startTime)
        : existingExam.startTime;
      const endTime = updateExamDto.endTime
        ? new Date(updateExamDto.endTime)
        : existingExam.endTime;

      const overlappingExam = await this.examModel.findOne({
        _id: { $ne: id },
        batches: { $in: batches },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
        status: { $ne: ExamStatus.CANCELLED },
      });

      if (overlappingExam) {
        throw new ConflictException('Exam overlaps with existing exam for selected batches');
      }
    }

    // Convert string IDs to ObjectId
    const updateData: any = { ...updateExamDto };
    if (updateExamDto.class) {
      updateData.class = new Types.ObjectId(updateExamDto.class);
    }
    if (updateExamDto.subject) {
      updateData.subject = new Types.ObjectId(updateExamDto.subject);
    }
    if (updateExamDto.batches) {
      updateData.batches = updateExamDto.batches.map(id => new Types.ObjectId(id));
    }
    
    // Update total marks if marks distribution is provided
    if (updateExamDto.marksDistribution && updateExamDto.marksDistribution.length > 0) {
      updateData.totalMarks = updateExamDto.marksDistribution.reduce(
        (sum, item) => sum + item.marks,
        0,
      );
    }

    // Update status based on new dates if provided
    const now = new Date();
    if (updateExamDto.examDate || updateExamDto.startTime || updateExamDto.endTime) {
      const examDate = updateExamDto.examDate
        ? new Date(updateExamDto.examDate)
        : existingExam.examDate;
      const startTime = updateExamDto.startTime
        ? new Date(updateExamDto.startTime)
        : existingExam.startTime;
      const endTime = updateExamDto.endTime
        ? new Date(updateExamDto.endTime)
        : existingExam.endTime;

      let status = existingExam.status;
      if (examDate > now) {
        status = ExamStatus.SCHEDULED;
      } else if (startTime <= now && endTime >= now) {
        status = ExamStatus.ONGOING;
      } else if (endTime < now) {
        status = ExamStatus.COMPLETED;
      }
      updateData.status = status;
    }

    // Add updatedBy if userId is provided
    if (userId) {
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updatedExam = await this.examModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .populate({
        path: 'updatedBy',
        select: 'username email firstName lastName',
      })
      .exec();

    if (!updatedExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return updatedExam;
  }

  async remove(id: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const deletedExam = await this.examModel
      .findByIdAndDelete(id)
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .exec();

    if (!deletedExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return deletedExam;
  }

  async toggleStatus(id: string, userId: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel.findById(id);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    exam.isActive = !exam.isActive;
    exam.updatedBy = new Types.ObjectId(userId);
    
    const savedExam = await exam.save();
    
    // Repopulate the exam
    const populatedExam = await this.examModel
      .findById(savedExam._id)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .populate({
        path: 'updatedBy',
        select: 'username email firstName lastName',
      })
      .exec();

    if (!populatedExam) {
      throw new NotFoundException(`Exam with ID ${id} not found after update`);
    }

    return populatedExam;
  }

  async updateExamStatus(id: string, status: ExamStatus, userId: string): Promise<Exam> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exam ID');
    }

    const exam = await this.examModel.findById(id);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    exam.status = status;
    exam.updatedBy = new Types.ObjectId(userId);
    
    const savedExam = await exam.save();
    
    // Repopulate the exam
    const populatedExam = await this.examModel
      .findById(savedExam._id)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .populate({
        path: 'updatedBy',
        select: 'username email firstName lastName',
      })
      .exec();

    if (!populatedExam) {
      throw new NotFoundException(`Exam with ID ${id} not found after update`);
    }

    return populatedExam;
  }

  async getStats(): Promise<IExamStats> {
    const [
      totalExams,
      scheduledExams,
      ongoingExams,
      completedExams,
      draftExams,
      allExams,
    ] = await Promise.all([
      this.examModel.countDocuments(),
      this.examModel.countDocuments({ status: ExamStatus.SCHEDULED }),
      this.examModel.countDocuments({ status: ExamStatus.ONGOING }),
      this.examModel.countDocuments({ status: ExamStatus.COMPLETED }),
      this.examModel.countDocuments({ status: ExamStatus.DRAFT }),
      this.examModel.find().select('totalMarks'),
    ]);

    // Calculate average marks
    const averageMarks = allExams.length > 0
      ? allExams.reduce((sum, exam) => sum + (exam.totalMarks || 0), 0) / allExams.length
      : 0;

    // Get upcoming exams (scheduled for today or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingExams = await this.examModel.countDocuments({
      examDate: { $gte: today },
      status: ExamStatus.SCHEDULED,
    });

    return {
      totalExams,
      scheduledExams,
      ongoingExams,
      completedExams,
      draftExams,
      averageMarks,
      upcomingExams,
    };
  }

  async getExamsByBatch(batchId: string, query?: any): Promise<{
    data: Exam[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(batchId)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const {
      status,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'examDate',
      sortOrder = 'asc',
    } = query || {};

    const filter: any = {
      batches: new Types.ObjectId(batchId),
    };

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const total = await this.examModel.countDocuments(filter);
    const skip = (page - 1) * limit;

    const data = await this.examModel
      .find(filter)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate({
        path: 'createdBy',
        select: 'username email firstName lastName',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .exec();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExamsByClassAndSubject(classId: string, subjectId: string): Promise<Exam[]> {
    if (!Types.ObjectId.isValid(classId) || !Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid class or subject ID');
    }

    const exams = await this.examModel
      .find({
        class: new Types.ObjectId(classId),
        subject: new Types.ObjectId(subjectId),
        isActive: true,
      })
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .sort({ examDate: 1 })
      .exec();

    return exams;
  }

  async getUpcomingExams(limit: number = 10): Promise<Exam[]> {
    const now = new Date();
    
    const exams = await this.examModel
      .find({
        examDate: { $gte: now },
        isActive: true,
        status: { $in: [ExamStatus.SCHEDULED, ExamStatus.DRAFT] },
      })
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .sort({ examDate: 1 })
      .limit(limit)
      .exec();

    return exams;
  }
}