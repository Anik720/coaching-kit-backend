import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentAttendance,
  StudentAttendanceDocument,
} from './student-attendance.schema';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { StudentAttendanceQueryDto } from './dto/student-attendance-query.dto';

function normalizeToStartOfDay(value: Date): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class StudentAttendanceService {
  constructor(
    @InjectModel(StudentAttendance.name)
    private attendanceModel: Model<StudentAttendanceDocument>,
  ) {}

  async create(dto: CreateStudentAttendanceDto, userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const classId = dto.class;
    const batchId = dto.batch;

    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }
    if (!Types.ObjectId.isValid(batchId)) {
      throw new BadRequestException('Invalid batch ID');
    }

    const attendanceDate = normalizeToStartOfDay(new Date(dto.attendanceDate));

    // prevent duplicates (also enforced by unique index)
    const existing = await this.attendanceModel.findOne({
      class: new Types.ObjectId(classId),
      batch: new Types.ObjectId(batchId),
      attendanceDate,
    });

    if (existing) {
      throw new ConflictException(
        'Attendance already exists for this class, batch and date',
      );
    }

    try {
      const doc = new this.attendanceModel({
        class: new Types.ObjectId(classId),
        batch: new Types.ObjectId(batchId),
        attendanceDate,
        classStartTime: dto.classStartTime,
        classEndTime: dto.classEndTime,
        attendanceType: dto.attendanceType,
        remarks: dto.remarks ?? '',
        isActive: dto.isActive ?? true,
        createdBy: new Types.ObjectId(userId),
      });

      return await doc.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Attendance already exists for this class, batch and date',
        );
      }
      throw new BadRequestException(error?.message ?? 'Failed to create attendance');
    }
  }

  async findAll(query: StudentAttendanceQueryDto) {
    const {
      search,
      class: classId,
      batch,
      date,
      startDate,
      endDate,
      attendanceType,
      createdBy,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [{ remarks: { $regex: search, $options: 'i' } }];
    }

    if (classId && Types.ObjectId.isValid(classId)) {
      filter.class = new Types.ObjectId(classId);
    }

    if (batch && Types.ObjectId.isValid(batch)) {
      filter.batch = new Types.ObjectId(batch);
    }

    if (attendanceType) {
      filter.attendanceType = attendanceType;
    }

    // Date filters
    if (date) {
      const d = normalizeToStartOfDay(new Date(date));
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.attendanceDate = { $gte: d, $lt: next };
    } else if (startDate || endDate) {
      const range: any = {};
      if (startDate) {
        range.$gte = normalizeToStartOfDay(new Date(startDate));
      }
      if (endDate) {
        const e = normalizeToStartOfDay(new Date(endDate));
        const next = new Date(e);
        next.setDate(next.getDate() + 1);
        range.$lt = next;
      }
      filter.attendanceDate = range;
    }

    if (createdBy && Types.ObjectId.isValid(createdBy)) {
      filter.createdBy = new Types.ObjectId(createdBy);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const currentPage = Math.max(1, Number(page));
    const pageSize = Math.max(1, Math.min(100, Number(limit)));
    const skip = (currentPage - 1) * pageSize;

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await this.attendanceModel.countDocuments(filter);

    const data = await this.attendanceModel
      .find(filter)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
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

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const doc = await this.attendanceModel
      .findById(id)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .exec();

    if (!doc) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return doc;
  }

  async update(id: string, dto: UpdateStudentAttendanceDto, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const existing = await this.attendanceModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    const updateData: any = { ...dto };

    if (dto.class) {
      if (!Types.ObjectId.isValid(dto.class)) {
        throw new BadRequestException('Invalid class ID');
      }
      updateData.class = new Types.ObjectId(dto.class);
    }

    if (dto.batch) {
      if (!Types.ObjectId.isValid(dto.batch)) {
        throw new BadRequestException('Invalid batch ID');
      }
      updateData.batch = new Types.ObjectId(dto.batch);
    }

    if (dto.attendanceDate) {
      updateData.attendanceDate = normalizeToStartOfDay(new Date(dto.attendanceDate));
    }

    updateData.updatedBy = new Types.ObjectId(userId);

    // If any of (class,batch,attendanceDate) changes, ensure uniqueness
    const nextClass = updateData.class ?? existing.class;
    const nextBatch = updateData.batch ?? existing.batch;
    const nextDate = updateData.attendanceDate ?? existing.attendanceDate;

    const dup = await this.attendanceModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      class: nextClass,
      batch: nextBatch,
      attendanceDate: normalizeToStartOfDay(new Date(nextDate)),
    });

    if (dup) {
      throw new ConflictException(
        'Attendance already exists for this class, batch and date',
      );
    }

    try {
      const updated = await this.attendanceModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('class', 'classname')
        .populate('batch', 'batchName')
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email')
        .exec();

      if (!updated) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      return updated;
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Attendance already exists for this class, batch and date',
        );
      }
      throw new BadRequestException(error?.message ?? 'Failed to update attendance');
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const doc = await this.attendanceModel
      .findByIdAndDelete(id)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .exec();

    if (!doc) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return doc;
  }
}