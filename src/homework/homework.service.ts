import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Homework, HomeworkDocument } from './homework.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { HomeworkQueryDto } from './dto/homework-query.dto';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
  ) {}

  async create(createHomeworkDto: CreateHomeworkDto, userId: string): Promise<Homework> {
    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if homework with same name, class, subject and date exists
      const existingHomework = await this.homeworkModel.findOne({
        homeworkName: createHomeworkDto.homeworkName,
        class: new Types.ObjectId(createHomeworkDto.class),
        subject: new Types.ObjectId(createHomeworkDto.subject),
        homeworkDate: new Date(createHomeworkDto.homeworkDate),
      });

      if (existingHomework) {
        throw new ConflictException(
          'Homework with this name already exists for the same class, subject and date',
        );
      }

      // Convert batch IDs to ObjectId
      const batchIds = createHomeworkDto.batches.map(
        (batchId) => new Types.ObjectId(batchId),
      );

      const homework = new this.homeworkModel({
        ...createHomeworkDto,
        class: new Types.ObjectId(createHomeworkDto.class),
        subject: new Types.ObjectId(createHomeworkDto.subject),
        batches: batchIds,
        homeworkDate: new Date(createHomeworkDto.homeworkDate),
        createdBy: new Types.ObjectId(userId),
        isActive: createHomeworkDto.isActive ?? true,
      });

      return await homework.save();
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException('Homework already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(query: HomeworkQueryDto): Promise<{
    data: Homework[];
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
      date,
      createdBy,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    // Build filter
    if (search) {
      filter.$or = [
        { homeworkName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (classId && Types.ObjectId.isValid(classId)) {
      filter.class = new Types.ObjectId(classId);
    }

    if (subject && Types.ObjectId.isValid(subject)) {
      filter.subject = new Types.ObjectId(subject);
    }

    if (batch && Types.ObjectId.isValid(batch)) {
      filter.batches = { $in: [new Types.ObjectId(batch)] };
    }

    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.homeworkDate = {
        $gte: dateObj,
        $lt: nextDay,
      };
    }

    if (createdBy && Types.ObjectId.isValid(createdBy)) {
      filter.createdBy = new Types.ObjectId(createdBy);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate pagination
    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await this.homeworkModel.countDocuments(filter);

    // Build query with population
    const data = await this.homeworkModel
      .find(filter)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .exec();

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<Homework> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid homework ID');
    }

    const homework = await this.homeworkModel
      .findById(id)
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .exec();

    if (!homework) {
      throw new NotFoundException(`Homework with ID ${id} not found`);
    }

    return homework;
  }

  async update(id: string, updateHomeworkDto: UpdateHomeworkDto, userId?: string): Promise<Homework> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid homework ID');
    }

    // Check if homework exists
    const existingHomework = await this.homeworkModel.findById(id);
    if (!existingHomework) {
      throw new NotFoundException(`Homework with ID ${id} not found`);
    }

    // Check for duplicate if homeworkName is being updated
    if (updateHomeworkDto.homeworkName) {
      const duplicate = await this.homeworkModel.findOne({
        _id: { $ne: id },
        homeworkName: updateHomeworkDto.homeworkName,
        class: updateHomeworkDto.class || existingHomework.class,
        subject: updateHomeworkDto.subject || existingHomework.subject,
        homeworkDate: updateHomeworkDto.homeworkDate 
          ? new Date(updateHomeworkDto.homeworkDate)
          : existingHomework.homeworkDate,
      });

      if (duplicate) {
        throw new ConflictException(
          'Homework with this name already exists for the same class, subject and date',
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...updateHomeworkDto };

    // Convert IDs to ObjectId if provided
    if (updateHomeworkDto.class) {
      updateData.class = new Types.ObjectId(updateHomeworkDto.class);
    }
    if (updateHomeworkDto.subject) {
      updateData.subject = new Types.ObjectId(updateHomeworkDto.subject);
    }
    if (updateHomeworkDto.batches) {
      updateData.batches = updateHomeworkDto.batches.map(
        (batchId) => new Types.ObjectId(batchId),
      );
    }
    if (updateHomeworkDto.homeworkDate) {
      updateData.homeworkDate = new Date(updateHomeworkDto.homeworkDate);
    }

    // Add updatedBy if userId is provided
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updatedHomework = await this.homeworkModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .exec();

    if (!updatedHomework) {
      throw new NotFoundException(`Homework with ID ${id} not found`);
    }

    return updatedHomework;
  }

  async remove(id: string): Promise<Homework> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid homework ID');
    }

    const homework = await this.homeworkModel
      .findByIdAndDelete(id)
      .populate('createdBy', 'username email')
      .exec();

    if (!homework) {
      throw new NotFoundException(`Homework with ID ${id} not found`);
    }

    return homework;
  }

  async toggleActive(id: string, userId: string): Promise<Homework> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid homework ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const homework = await this.homeworkModel.findById(id).exec();
    if (!homework) {
      throw new NotFoundException(`Homework with ID ${id} not found`);
    }

    // Toggle active status
    homework.isActive = !homework.isActive;
    homework.updatedBy = new Types.ObjectId(userId);
    
    await homework.save();

    // Populate before returning
    await homework.populate([
      { path: 'class', select: 'classname' },
      { path: 'subject', select: 'subjectName' },
      { path: 'batches', select: 'batchName' },
      { path: 'createdBy', select: 'username email' },
      { path: 'updatedBy', select: 'username email' },
    ]);

    return homework;
  }

  async getHomeworkStats(): Promise<{
    totalHomework: number;
    activeHomework: number;
    upcomingHomework: number;
    completedHomework: number;
  }> {
    const today = new Date();
    
    const [
      totalHomework,
      activeHomework,
      upcomingHomework,
      completedHomework,
    ] = await Promise.all([
      this.homeworkModel.countDocuments(),
      this.homeworkModel.countDocuments({ isActive: true }),
      this.homeworkModel.countDocuments({ homeworkDate: { $gt: today } }),
      this.homeworkModel.countDocuments({ homeworkDate: { $lt: today } }),
    ]);

    return {
      totalHomework,
      activeHomework,
      upcomingHomework,
      completedHomework,
    };
  }

  async getHomeworkByDateRange(startDate: Date, endDate: Date): Promise<Homework[]> {
    return await this.homeworkModel
      .find({
        homeworkDate: { $gte: startDate, $lte: endDate },
      })
      .populate('class', 'classname')
      .populate('subject', 'subjectName')
      .populate('batches', 'batchName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ homeworkDate: 1 })
      .exec();
  }
}