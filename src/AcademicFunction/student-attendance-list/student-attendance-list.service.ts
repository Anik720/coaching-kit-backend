import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentAttendanceList,
  StudentAttendanceListDocument,
} from './entities/student-attendance-list.schema';
import { CreateStudentAttendanceListDto } from './dto/create-student-attendance-list.dto';
import { UpdateStudentAttendanceListDto } from './dto/update-student-attendance-list.dto';
import { StudentAttendanceListQueryDto } from './dto/student-attendance-list-query.dto';

function normalizeToStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class StudentAttendanceListService {
  constructor(
    @InjectModel(StudentAttendanceList.name)
    private attendanceListModel: Model<StudentAttendanceListDocument>,
  ) {}

  async create(dto: CreateStudentAttendanceListDto, userId: string): Promise<StudentAttendanceList> {
    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate object IDs
      if (!Types.ObjectId.isValid(dto.class)) {
        throw new BadRequestException('Invalid class ID');
      }
      if (!Types.ObjectId.isValid(dto.batch)) {
        throw new BadRequestException('Invalid batch ID');
      }
      if (!Types.ObjectId.isValid(dto.student)) {
        throw new BadRequestException('Invalid student ID');
      }

      const attendanceDate = normalizeToStartOfDay(new Date(dto.attendanceDate));

      // Check for existing attendance for same student, class, batch, and date
      const existingAttendance = await this.attendanceListModel.findOne({
        class: new Types.ObjectId(dto.class),
        batch: new Types.ObjectId(dto.batch),
        student: new Types.ObjectId(dto.student),
        attendanceDate,
      });

      if (existingAttendance) {
        throw new ConflictException(
          'Attendance already exists for this student, class, batch and date',
        );
      }

      const attendance = new this.attendanceListModel({
        class: new Types.ObjectId(dto.class),
        batch: new Types.ObjectId(dto.batch),
        student: new Types.ObjectId(dto.student),
        attendanceDate,
        status: dto.status,
        vitalTherm: dto.vitalTherm,
        vitalPerm: dto.vitalPerm,
        vitalAsem: dto.vitalAsem,
        begin: dto.begin,
        remarks: dto.remarks,
        isActive: dto.isActive ?? true,
        createdBy: new Types.ObjectId(userId),
      });

      return await attendance.save();
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      if (error?.code === 11000) {
        throw new ConflictException(
          'Attendance already exists for this student, class, batch and date',
        );
      }
      throw new BadRequestException(error?.message ?? 'Failed to create attendance');
    }
  }

  async createBulk(
    dtos: CreateStudentAttendanceListDto[],
    userId: string,
  ): Promise<{
    data: StudentAttendanceList[];
    successCount: number;
    failedCount: number;
    errors: Array<{ studentId: string; error: string }>;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const results: StudentAttendanceList[] = [];
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const dto of dtos) {
      try {
        const attendance = await this.create(dto, userId);
        results.push(attendance);
      } catch (error) {
        errors.push({
          studentId: dto.student,
          error: error.message || 'Failed to create attendance',
        });
      }
    }

    return {
      data: results,
      successCount: results.length,
      failedCount: errors.length,
      errors,
    };
  }

  async findAll(query: StudentAttendanceListQueryDto): Promise<{
    data: StudentAttendanceList[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      class: classId,
      batch,
      student,
      date,
      startDate,
      endDate,
      status,
      createdBy,
      isActive,
      minTherm,
      maxTherm,
      minPerm,
      maxPerm,
      minAsem,
      maxAsem,
      page = 1,
      limit = 20,
      sortBy = 'attendanceDate',
      sortOrder = 'desc',
    } = query;

    const filter: any = {};

    // Build filter
    if (search) {
      filter.$or = [
        { remarks: { $regex: search, $options: 'i' } },
        { begin: { $regex: search, $options: 'i' } },
      ];
    }

    if (classId && Types.ObjectId.isValid(classId)) {
      filter.class = new Types.ObjectId(classId);
    }

    if (batch && Types.ObjectId.isValid(batch)) {
      filter.batch = new Types.ObjectId(batch);
    }

    if (student && Types.ObjectId.isValid(student)) {
      filter.student = new Types.ObjectId(student);
    }

    if (status) {
      filter.status = status;
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

    // Vital measurement filters
    if (minTherm !== undefined || maxTherm !== undefined) {
      filter.vitalTherm = {};
      if (minTherm !== undefined) filter.vitalTherm.$gte = minTherm;
      if (maxTherm !== undefined) filter.vitalTherm.$lte = maxTherm;
    }

    if (minPerm !== undefined || maxPerm !== undefined) {
      filter.vitalPerm = {};
      if (minPerm !== undefined) filter.vitalPerm.$gte = minPerm;
      if (maxPerm !== undefined) filter.vitalPerm.$lte = maxPerm;
    }

    if (minAsem !== undefined || maxAsem !== undefined) {
      filter.vitalAsem = {};
      if (minAsem !== undefined) filter.vitalAsem.$gte = minAsem;
      if (maxAsem !== undefined) filter.vitalAsem.$lte = maxAsem;
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
    const total = await this.attendanceListModel.countDocuments(filter);

    // Build query with population
    const data = await this.attendanceListModel
      .find(filter)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .populate('student', 'studentId firstName lastName')
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

  async findOne(id: string): Promise<StudentAttendanceList> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const attendance = await this.attendanceListModel
      .findById(id)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .populate('student', 'studentId firstName lastName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async update(
    id: string,
    dto: UpdateStudentAttendanceListDto,
    userId: string,
  ): Promise<StudentAttendanceList> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const existingAttendance = await this.attendanceListModel.findById(id).exec();
    if (!existingAttendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    const updateData: any = { ...dto };

    // Convert IDs to ObjectId if provided
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

    if (dto.student) {
      if (!Types.ObjectId.isValid(dto.student)) {
        throw new BadRequestException('Invalid student ID');
      }
      updateData.student = new Types.ObjectId(dto.student);
    }

    if (dto.attendanceDate) {
      updateData.attendanceDate = normalizeToStartOfDay(new Date(dto.attendanceDate));
    }

    updateData.updatedBy = new Types.ObjectId(userId);

    // Check for duplicates if any identifying fields are being updated
    const nextClass = updateData.class || existingAttendance.class;
    const nextBatch = updateData.batch || existingAttendance.batch;
    const nextStudent = updateData.student || existingAttendance.student;
    const nextDate = updateData.attendanceDate || existingAttendance.attendanceDate;

    const duplicate = await this.attendanceListModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      class: nextClass,
      batch: nextBatch,
      student: nextStudent,
      attendanceDate: normalizeToStartOfDay(new Date(nextDate)),
    });

    if (duplicate) {
      throw new ConflictException(
        'Attendance already exists for this student, class, batch and date',
      );
    }

    try {
      const updatedAttendance = await this.attendanceListModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('class', 'classname')
        .populate('batch', 'batchName')
        .populate('student', 'studentId firstName lastName')
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email')
        .exec();

      if (!updatedAttendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      return updatedAttendance;
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Attendance already exists for this student, class, batch and date',
        );
      }
      throw new BadRequestException(error?.message ?? 'Failed to update attendance');
    }
  }

  async remove(id: string): Promise<StudentAttendanceList> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const attendance = await this.attendanceListModel
      .findByIdAndDelete(id)
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .populate('student', 'studentId firstName lastName')
      .populate('createdBy', 'username email')
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async getAttendanceStats(query: {
    class?: string;
    batch?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const filter: any = {};

    if (query.class && Types.ObjectId.isValid(query.class)) {
      filter.class = new Types.ObjectId(query.class);
    }

    if (query.batch && Types.ObjectId.isValid(query.batch)) {
      filter.batch = new Types.ObjectId(query.batch);
    }

    // Date filters
    if (query.date) {
      const d = normalizeToStartOfDay(new Date(query.date));
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.attendanceDate = { $gte: d, $lt: next };
    } else if (query.startDate || query.endDate) {
      const range: any = {};
      if (query.startDate) {
        range.$gte = normalizeToStartOfDay(new Date(query.startDate));
      }
      if (query.endDate) {
        const e = normalizeToStartOfDay(new Date(query.endDate));
        const next = new Date(e);
        next.setDate(next.getDate() + 1);
        range.$lt = next;
      }
      filter.attendanceDate = range;
    }

    const attendanceRecords = await this.attendanceListModel
      .find(filter)
      .select('status vitalTherm vitalPerm vitalAsem')
      .exec();

    const total = attendanceRecords.length;
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      halfDay: 0,
      totalVitalTherm: 0,
      totalVitalPerm: 0,
      totalVitalAsem: 0,
      countWithVitalTherm: 0,
      countWithVitalPerm: 0,
      countWithVitalAsem: 0,
    };

    attendanceRecords.forEach((record) => {
      switch (record.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'leave':
          stats.leave++;
          break;
        case 'half_day':
          stats.halfDay++;
          break;
      }

      if (record.vitalTherm !== undefined) {
        stats.totalVitalTherm += record.vitalTherm;
        stats.countWithVitalTherm++;
      }

      if (record.vitalPerm !== undefined) {
        stats.totalVitalPerm += record.vitalPerm;
        stats.countWithVitalPerm++;
      }

      if (record.vitalAsem !== undefined) {
        stats.totalVitalAsem += record.vitalAsem;
        stats.countWithVitalAsem++;
      }
    });

    const attendanceRate = total > 0 ? ((stats.present + stats.halfDay * 0.5) / total) * 100 : 0;

    return {
      totalStudents: total,
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      leaveCount: stats.leave,
      halfDayCount: stats.halfDay,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      avgVitalTherm: stats.countWithVitalTherm > 0 ? 
        Math.round((stats.totalVitalTherm / stats.countWithVitalTherm) * 100) / 100 : undefined,
      avgVitalPerm: stats.countWithVitalPerm > 0 ? 
        Math.round((stats.totalVitalPerm / stats.countWithVitalPerm) * 100) / 100 : undefined,
      avgVitalAsem: stats.countWithVitalAsem > 0 ? 
        Math.round((stats.totalVitalAsem / stats.countWithVitalAsem) * 100) / 100 : undefined,
    };
  }

  async getAttendanceByDateRange(
    classId: string,
    batchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StudentAttendanceList[]> {
    if (!Types.ObjectId.isValid(classId) || !Types.ObjectId.isValid(batchId)) {
      throw new BadRequestException('Invalid class or batch ID');
    }

    const start = normalizeToStartOfDay(startDate);
    const end = normalizeToStartOfDay(endDate);
    end.setDate(end.getDate() + 1);

    return await this.attendanceListModel
      .find({
        class: new Types.ObjectId(classId),
        batch: new Types.ObjectId(batchId),
        attendanceDate: { $gte: start, $lt: end },
      })
      .populate('class', 'classname')
      .populate('batch', 'batchName')
      .populate('student', 'studentId firstName lastName')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort({ attendanceDate: 1, student: 1 })
      .exec();
  }

  async toggleActive(id: string, userId: string): Promise<StudentAttendanceList> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const attendance = await this.attendanceListModel.findById(id).exec();
    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    attendance.isActive = !attendance.isActive;
    attendance.updatedBy = new Types.ObjectId(userId);
    await attendance.save();

    await attendance.populate([
      { path: 'class', select: 'classname' },
      { path: 'batch', select: 'batchName' },
      { path: 'student', select: 'studentId firstName lastName' },
      { path: 'createdBy', select: 'username email' },
      { path: 'updatedBy', select: 'username email' },
    ]);

    return attendance;
  }
}