import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IBatchStats } from './interfaces/batch.interface';
import { Batch, BatchDocument } from './batch.schema';
import { CreateBatchDto } from './dto/create-batch.dto';
import { BatchQueryDto } from './dto/batch-query.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchService {
  constructor(
    @InjectModel(Batch.name) private batchModel: Model<BatchDocument>,
  ) {}

  async create(createBatchDto: CreateBatchDto): Promise<Batch> {
    try {
      // Check if batch with same name and references already exists
      const existingBatch = await this.batchModel.findOne({
        batchName: createBatchDto.batchName,
        className: new Types.ObjectId(createBatchDto.className),
        group: new Types.ObjectId(createBatchDto.group),
        subject: new Types.ObjectId(createBatchDto.subject),
      });

      if (existingBatch) {
        throw new ConflictException(
          'Batch with this name and combination already exists',
        );
      }

      // Validate dates
      const startingDate = new Date(createBatchDto.batchStartingDate);
      const closingDate = new Date(createBatchDto.batchClosingDate);

      if (startingDate >= closingDate) {
        throw new BadRequestException(
          'Batch starting date must be before closing date',
        );
      }

      const batch = new this.batchModel({
        ...createBatchDto,
        className: new Types.ObjectId(createBatchDto.className),
        group: new Types.ObjectId(createBatchDto.group),
        subject: new Types.ObjectId(createBatchDto.subject),
      });

      return await batch.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Batch already exists');
      }
      throw error;
    }
  }

  async findAll(query: BatchQueryDto): Promise<{
    data: Batch[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      className,
      group,
      subject,
      sessionYear,
      status,
      isActive,
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
        { batchName: { $regex: search, $options: 'i' } },
        { sessionYear: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (className) {
      filter.className = new Types.ObjectId(className);
    }

    if (group) {
      filter.group = new Types.ObjectId(group);
    }

    if (subject) {
      filter.subject = new Types.ObjectId(subject);
    }

    if (sessionYear) {
      filter.sessionYear = sessionYear;
    }

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Get total count
    const total = await this.batchModel.countDocuments(filter);

    // Build query
    const batchQuery = this.batchModel
      .find(filter)
      .populate('className', 'classname')
      .populate('group', 'groupName')
      .populate('subject', 'subjectName')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const data = await batchQuery.exec();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Batch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const batch = await this.batchModel
      .findById(id)
      .populate('className', 'classname')
      .populate('group', 'groupName')
      .populate('subject', 'subjectName')
      .exec();

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  async update(id: string, updateBatchDto: UpdateBatchDto): Promise<Batch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid batch ID');
    }

    // Check if batch exists
    const existingBatch = await this.batchModel.findById(id);
    if (!existingBatch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    // Check for duplicate if batchName is being updated
    if (updateBatchDto.batchName) {
      const duplicate = await this.batchModel.findOne({
        _id: { $ne: id },
        batchName: updateBatchDto.batchName,
        className: updateBatchDto.className || existingBatch.className,
        group: updateBatchDto.group || existingBatch.group,
        subject: updateBatchDto.subject || existingBatch.subject,
      });

      if (duplicate) {
        throw new ConflictException(
          'Batch with this name and combination already exists',
        );
      }
    }

    // Convert string IDs to ObjectId
    const updateData: any = { ...updateBatchDto };
    if (updateBatchDto.className) {
      updateData.className = new Types.ObjectId(updateBatchDto.className);
    }
    if (updateBatchDto.group) {
      updateData.group = new Types.ObjectId(updateBatchDto.group);
    }
    if (updateBatchDto.subject) {
      updateData.subject = new Types.ObjectId(updateBatchDto.subject);
    }

    // Validate dates if provided
    if (updateBatchDto.batchStartingDate || updateBatchDto.batchClosingDate) {
      const startingDate = updateBatchDto.batchStartingDate
        ? new Date(updateBatchDto.batchStartingDate)
        : existingBatch.batchStartingDate;
      const closingDate = updateBatchDto.batchClosingDate
        ? new Date(updateBatchDto.batchClosingDate)
        : existingBatch.batchClosingDate;

      if (startingDate >= closingDate) {
        throw new BadRequestException(
          'Batch starting date must be before closing date',
        );
      }
    }

    const updatedBatch = await this.batchModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('className', 'classname')
      .populate('group', 'groupName')
      .populate('subject', 'subjectName')
      .exec();

    if (!updatedBatch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return updatedBatch;
  }

  async remove(id: string): Promise<Batch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const batch = await this.batchModel.findByIdAndDelete(id).exec();

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    return batch;
  }

  async toggleStatus(id: string): Promise<Batch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const batch = await this.batchModel.findById(id);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${id} not found`);
    }

    batch.isActive = !batch.isActive;
    return await batch.save();
  }

  async getStats(): Promise<IBatchStats> {
    const [
      totalBatches,
      activeBatches,
      completedBatches,
      upcomingBatches,
      batchesWithFees,
    ] = await Promise.all([
      this.batchModel.countDocuments(),
      this.batchModel.countDocuments({ status: 'active', isActive: true }),
      this.batchModel.countDocuments({ status: 'completed' }),
      this.batchModel.countDocuments({ status: 'upcoming' }),
      this.batchModel.find().select('admissionFee tuitionFee courseFee'),
    ]);

    const totalRevenue = batchesWithFees.reduce((sum, batch) => {
      return sum + batch.admissionFee + batch.tuitionFee + batch.courseFee;
    }, 0);

    const averageFee =
      batchesWithFees.length > 0
        ? totalRevenue / batchesWithFees.length
        : 0;

    return {
      totalBatches,
      activeBatches,
      completedBatches,
      upcomingBatches,
      totalRevenue,
      averageFee,
    };
  }

  async getBatchesByDateRange(startDate: Date, endDate: Date): Promise<Batch[]> {
    return await this.batchModel
      .find({
        batchStartingDate: { $gte: startDate },
        batchClosingDate: { $lte: endDate },
      })
      .populate('className', 'classname')
      .populate('group', 'groupName')
      .populate('subject', 'subjectName')
      .exec();
  }

  async checkBatchAvailability(batchId: string): Promise<{
    available: boolean;
    currentStudents: number;
    maxStudents: number;
  }> {
    const batch = await this.batchModel.findById(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    // Here you would typically query student enrollments
    // For now, returning mock data
    const currentStudents = 0; // Replace with actual student count query

    return {
      available: currentStudents < batch.maxStudents,
      currentStudents,
      maxStudents: batch.maxStudents,
    };
  }
}