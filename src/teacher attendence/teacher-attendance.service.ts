// attendance/teacher-attendance.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  TeacherAttendance, 
  TeacherAttendanceDocument,
  AttendanceStatus 
} from './schemas/teacher-attendance.schema';
import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';
import { ApproveAttendanceDto } from './dto/approve-attendance.dto';
import { TeacherAttendanceResponseDto } from './dto/teacher-attendance-response.dto';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    @InjectModel(TeacherAttendance.name) 
    private teacherAttendanceModel: Model<TeacherAttendanceDocument>,
  ) {}

  private mapAttendanceDetailToResponse(detail: any): any {
    const classDetails = detail.classDetails || detail.class;
    const batchDetails = detail.batchDetails || detail.batch;
    const subjectDetails = detail.subjectDetails || detail.subject;

    const classObj = classDetails ? {
      _id: classDetails._id?.toString() || (typeof classDetails === 'string' ? classDetails : ''),
      classname: classDetails.classname || 'Unknown Class'
    } : {
      _id: detail.class?.toString() || '',
      classname: 'Unknown Class'
    };

    const batchObj = batchDetails ? {
      _id: batchDetails._id?.toString() || (typeof batchDetails === 'string' ? batchDetails : ''),
      batchName: batchDetails.batchName || 'Unknown Batch',
      sessionYear: batchDetails.sessionYear || ''
    } : {
      _id: detail.batch?.toString() || '',
      batchName: 'Unknown Batch',
      sessionYear: ''
    };

    const subjectObj = subjectDetails ? {
      _id: subjectDetails._id?.toString() || (typeof subjectDetails === 'string' ? subjectDetails : ''),
      subjectName: subjectDetails.subjectName || 'Unknown Subject',
      subjectCode: subjectDetails.subjectCode || ''
    } : {
      _id: detail.subject?.toString() || '',
      subjectName: 'Unknown Subject',
      subjectCode: ''
    };

    return {
      _id: detail._id?.toString(),
      class: classObj,
      batch: batchObj,
      subject: subjectObj,
      status: detail.status || 'present',
      remarks: detail.remarks || ''
    };
  }

  private mapToResponseDto(attendance: TeacherAttendanceDocument | any): TeacherAttendanceResponseDto {
    try {
      const teacherDetails = (attendance as any).teacherDetails as any;
      const createdByUser = (attendance as any).createdByUser as any;
      const updatedByUser = (attendance as any).updatedByUser as any;
      const approvedByUser = (attendance as any).approvedByUser as any;
      const attendanceId = (attendance as any)._id;

      // Map attendance details with explicit type
      const attendanceDetails = (attendance.attendanceDetails || []).map((detail: any) => 
        this.mapAttendanceDetailToResponse(detail)
      );

      // Create teacher response - always required
      const teacherObj = teacherDetails ? {
        _id: teacherDetails._id?.toString() || '',
        fullName: teacherDetails.fullName || 'Unknown Teacher',
        email: teacherDetails.email || '',
        designation: teacherDetails.designation || ''
      } : {
        _id: attendance.teacher?.toString() || '',
        fullName: 'Unknown Teacher',
        email: '',
        designation: ''
      };

      // Create optional user responses
      const createdByObj = createdByUser ? {
        _id: createdByUser._id?.toString() || '',
        email: createdByUser.email,
        username: createdByUser.username,
        role: createdByUser.role,
        name: createdByUser.name
      } : undefined;

      const updatedByObj = updatedByUser ? {
        _id: updatedByUser._id?.toString() || '',
        email: updatedByUser.email,
        username: updatedByUser.username,
        role: updatedByUser.role,
        name: updatedByUser.name
      } : undefined;

      const approvedByObj = approvedByUser ? {
        _id: approvedByUser._id?.toString() || '',
        email: approvedByUser.email,
        username: approvedByUser.username,
        role: approvedByUser.role,
        name: approvedByUser.name
      } : undefined;

      // Build the response DTO with explicit property assignments
      const response: TeacherAttendanceResponseDto = {
        _id: attendanceId?.toString() || '',
        teacher: teacherObj,
        date: attendance.date || new Date(),
        attendanceDetails: attendanceDetails,
        totalClasses: attendance.totalClasses || 0,
        attendedClasses: attendance.attendedClasses || 0,
        absentClasses: attendance.absentClasses || 0,
        approvalStatus: attendance.approvalStatus || 'submitted',
        submittedBy: attendance.submittedBy || '',
        approvedBy: approvedByObj,
        approvedAt: attendance.approvedAt,
        approvalRemarks: attendance.approvalRemarks || '',
        createdBy: createdByObj,
        updatedBy: updatedByObj,
        createdAt: (attendance as any).createdAt || new Date(),
        updatedAt: (attendance as any).updatedAt || new Date()
      };

      return response;
    } catch (error) {
      console.error('Error mapping attendance to response DTO:', error, attendance);
      throw new InternalServerErrorException('Error processing attendance data');
    }
  }

  async create(createAttendanceDto: CreateTeacherAttendanceDto, userId: string): Promise<TeacherAttendanceResponseDto> {
    try {
      console.log('Creating attendance for teacher:', createAttendanceDto.teacher);

      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Validate teacher ID
      if (!Types.ObjectId.isValid(createAttendanceDto.teacher)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      // Check if attendance already exists for this teacher on this date
      const existingAttendance = await this.teacherAttendanceModel.findOne({
        teacher: new Types.ObjectId(createAttendanceDto.teacher),
        date: createAttendanceDto.date
      });

      if (existingAttendance) {
        throw new ConflictException('Attendance already exists for this teacher on the selected date');
      }

      // Validate attendance details
      if (!createAttendanceDto.attendanceDetails || createAttendanceDto.attendanceDetails.length === 0) {
        throw new BadRequestException('Attendance details are required');
      }

      // Validate each attendance detail
      for (const detail of createAttendanceDto.attendanceDetails) {
        if (!Types.ObjectId.isValid(detail.class)) {
          throw new BadRequestException(`Invalid class ID: ${detail.class}`);
        }
        if (!Types.ObjectId.isValid(detail.batch)) {
          throw new BadRequestException(`Invalid batch ID: ${detail.batch}`);
        }
        if (!Types.ObjectId.isValid(detail.subject)) {
          throw new BadRequestException(`Invalid subject ID: ${detail.subject}`);
        }
      }

      const createdAttendance = new this.teacherAttendanceModel({
        ...createAttendanceDto,
        teacher: new Types.ObjectId(createAttendanceDto.teacher),
        attendanceDetails: createAttendanceDto.attendanceDetails.map(detail => ({
          ...detail,
          class: new Types.ObjectId(detail.class),
          batch: new Types.ObjectId(detail.batch),
          subject: new Types.ObjectId(detail.subject)
        })),
        createdBy: new Types.ObjectId(userId)
      });

      const savedAttendance = await createdAttendance.save();
      console.log('Attendance created successfully for teacher:', createAttendanceDto.teacher);

      const populatedAttendance = await this.teacherAttendanceModel
        .findById(savedAttendance._id)
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .exec();

      if (!populatedAttendance) {
        throw new Error('Failed to create attendance');
      }

      return this.mapToResponseDto(populatedAttendance);
    } catch (error: any) {
      console.error('Attendance creation error:', error);
      if (error.code === 11000) {
        throw new ConflictException('Attendance already exists for this teacher on this date');
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Attendance creation failed');
    }
  }

  async findAll(query: any): Promise<TeacherAttendanceResponseDto[]> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        teacher,
        date,
        startDate,
        endDate,
        approvalStatus,
        class: classId,
        batch: batchId,
        subject: subjectId,
        createdBy
      } = query;

      const filter: any = {};

      if (search) {
        filter.$or = [
          { submittedBy: { $regex: search, $options: 'i' } },
          { approvalRemarks: { $regex: search, $options: 'i' } }
        ];
      }

      if (teacher && Types.ObjectId.isValid(teacher)) {
        filter.teacher = new Types.ObjectId(teacher);
      }

      if (date) {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          // Set date to start of day for comparison
          const startOfDay = new Date(dateObj);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateObj);
          endOfDay.setHours(23, 59, 59, 999);
          filter.date = { $gte: startOfDay, $lte: endOfDay };
        }
      }

      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj.setHours(23, 59, 59, 999);
          filter.date = { $gte: startDateObj, $lte: endDateObj };
        }
      }

      if (approvalStatus) {
        filter.approvalStatus = approvalStatus;
      }

      if (classId && Types.ObjectId.isValid(classId)) {
        filter['attendanceDetails.class'] = new Types.ObjectId(classId);
      }

      if (batchId && Types.ObjectId.isValid(batchId)) {
        filter['attendanceDetails.batch'] = new Types.ObjectId(batchId);
      }

      if (subjectId && Types.ObjectId.isValid(subjectId)) {
        filter['attendanceDetails.subject'] = new Types.ObjectId(subjectId);
      }

      if (createdBy && Types.ObjectId.isValid(createdBy)) {
        filter.createdBy = new Types.ObjectId(createdBy);
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const attendances = await this.teacherAttendanceModel
        .find(filter)
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ date: -1, createdAt: -1 })
        .exec();

      // Explicitly type the map callback
      return attendances.map((attendance: any) => this.mapToResponseDto(attendance));
    } catch (error) {
      console.error('Find all attendances error:', error);
      throw new InternalServerErrorException('Failed to fetch attendances');
    }
  }

  async findOne(id: string): Promise<TeacherAttendanceResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID');
      }

      const attendance = await this.teacherAttendanceModel
        .findById(id)
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .exec();

      if (!attendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      return this.mapToResponseDto(attendance);
    } catch (error) {
      console.error('Find one attendance error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch attendance');
    }
  }

  async findByTeacherAndDate(teacherId: string, date: string): Promise<TeacherAttendanceResponseDto[]> {
    try {
      if (!Types.ObjectId.isValid(teacherId)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      // Set date to start of day for comparison
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const attendances = await this.teacherAttendanceModel
        .find({
          teacher: new Types.ObjectId(teacherId),
          date: { $gte: startOfDay, $lte: endOfDay }
        })
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .sort({ createdAt: -1 })
        .exec();

      return attendances.map((attendance: any) => this.mapToResponseDto(attendance));
    } catch (error) {
      console.error('Find by teacher and date error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch attendances');
    }
  }

  async update(id: string, updateAttendanceDto: UpdateTeacherAttendanceDto, userId?: string): Promise<TeacherAttendanceResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID');
      }

      // Check if attendance exists and can be updated
      const existingAttendance = await this.teacherAttendanceModel.findById(id);
      if (!existingAttendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      // Check if attendance is already approved
      if (existingAttendance.approvalStatus === 'approved') {
        throw new ForbiddenException('Cannot modify approved attendance');
      }

      const updateData: any = { ...updateAttendanceDto };

      // Convert IDs if provided
      if (updateData.teacher && Types.ObjectId.isValid(updateData.teacher)) {
        updateData.teacher = new Types.ObjectId(updateData.teacher);
      }

      // Check for duplicate attendance if teacher or date is being updated
      if (updateData.teacher || updateData.date) {
        const teacherId = updateData.teacher || existingAttendance.teacher;
        const date = updateData.date || existingAttendance.date;

        const duplicateAttendance = await this.teacherAttendanceModel.findOne({
          teacher: teacherId,
          date: date,
          _id: { $ne: new Types.ObjectId(id) }
        });

        if (duplicateAttendance) {
          throw new ConflictException('Attendance already exists for this teacher on the selected date');
        }
      }

      // Convert attendance details IDs if provided
      if (updateData.attendanceDetails && updateData.attendanceDetails.length > 0) {
        updateData.attendanceDetails = updateData.attendanceDetails.map(detail => ({
          ...detail,
          class: new Types.ObjectId(detail.class),
          batch: new Types.ObjectId(detail.batch),
          subject: new Types.ObjectId(detail.subject)
        }));
      }

      // Add updatedBy if userId is provided
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID');
        }
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      const attendance = await this.teacherAttendanceModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .exec();

      if (!attendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      return this.mapToResponseDto(attendance);
    } catch (error: any) {
      console.error('Update attendance error:', error);
      if (error.code === 11000) {
        throw new ConflictException('Attendance already exists for this teacher on this date');
      }
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ConflictException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update attendance');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID');
      }

      // Check if attendance is approved
      const attendance = await this.teacherAttendanceModel.findById(id);
      if (attendance && attendance.approvalStatus === 'approved') {
        throw new ForbiddenException('Cannot delete approved attendance');
      }

      const result = await this.teacherAttendanceModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Delete attendance error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete attendance');
    }
  }

  async approveAttendance(id: string, approveDto: ApproveAttendanceDto, userId: string): Promise<TeacherAttendanceResponseDto> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid attendance ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const attendance = await this.teacherAttendanceModel.findById(id);
      if (!attendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      // Check if already approved/rejected
      if (attendance.approvalStatus !== 'submitted' && attendance.approvalStatus !== 'pending') {
        throw new BadRequestException(`Attendance is already ${attendance.approvalStatus}`);
      }

      const updateData = {
        approvalStatus: approveDto.approvalStatus,
        approvalRemarks: approveDto.remarks,
        approvedBy: new Types.ObjectId(userId),
        approvedAt: new Date()
      };

      const updatedAttendance = await this.teacherAttendanceModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('teacherDetails', 'fullName email designation')
        .populate('createdByUser', 'email username role name')
        .populate('updatedByUser', 'email username role name')
        .populate('approvedByUser', 'email username role name')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .exec();

      if (!updatedAttendance) {
        throw new NotFoundException(`Attendance with ID ${id} not found`);
      }

      return this.mapToResponseDto(updatedAttendance);
    } catch (error) {
      console.error('Approve attendance error:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to approve attendance');
    }
  }

  async getStatistics(query: any, userId?: string): Promise<any> {
    try {
      const { 
        teacher, 
        startDate, 
        endDate,
        month,
        year 
      } = query;

      const filter: any = { approvalStatus: 'approved' };

      if (teacher && Types.ObjectId.isValid(teacher)) {
        filter.teacher = new Types.ObjectId(teacher);
      }

      if (userId && Types.ObjectId.isValid(userId)) {
        filter.createdBy = new Types.ObjectId(userId);
      }

      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj.setHours(23, 59, 59, 999);
          filter.date = { $gte: startDateObj, $lte: endDateObj };
        }
      } else if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        filter.date = { $gte: startDate, $lte: endDate };
      }

      const [totalAttendances, totalClasses, attendedClasses, absentClasses, attendanceByDate, attendanceByTeacher] = await Promise.all([
        this.teacherAttendanceModel.countDocuments(filter),
        this.teacherAttendanceModel.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$totalClasses' } } }
        ]),
        this.teacherAttendanceModel.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$attendedClasses' } } }
        ]),
        this.teacherAttendanceModel.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$absentClasses' } } }
        ]),
        this.teacherAttendanceModel.aggregate([
          { $match: filter },
          { 
            $group: { 
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              count: { $sum: 1 },
              totalClasses: { $sum: '$totalClasses' },
              attendedClasses: { $sum: '$attendedClasses' }
            } 
          },
          { $sort: { _id: -1 } },
          { $limit: 30 }
        ]),
        this.teacherAttendanceModel.aggregate([
          { $match: filter },
          { 
            $lookup: {
              from: 'teachers',
              localField: 'teacher',
              foreignField: '_id',
              as: 'teacherDetails'
            }
          },
          { $unwind: '$teacherDetails' },
          { 
            $group: { 
              _id: '$teacher',
              teacherName: { $first: '$teacherDetails.fullName' },
              count: { $sum: 1 },
              totalClasses: { $sum: '$totalClasses' },
              attendedClasses: { $sum: '$attendedClasses' },
              attendanceRate: { 
                $avg: { 
                  $cond: [
                    { $eq: ['$totalClasses', 0] },
                    0,
                    { $divide: ['$attendedClasses', '$totalClasses'] }
                  ]
                }
              }
            } 
          },
          { $sort: { attendanceRate: -1 } }
        ])
      ]);

      return {
        totalAttendances,
        totalClasses: totalClasses[0]?.total || 0,
        attendedClasses: attendedClasses[0]?.total || 0,
        absentClasses: absentClasses[0]?.total || 0,
        attendanceRate: totalClasses[0]?.total ? 
          (attendedClasses[0]?.total / totalClasses[0]?.total) * 100 : 0,
        attendanceByDate,
        attendanceByTeacher
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      throw new InternalServerErrorException('Failed to get attendance statistics');
    }
  }

  async getMonthlyReport(teacherId: string, month: number, year: number): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(teacherId)) {
        throw new BadRequestException('Invalid teacher ID');
      }

      if (month < 1 || month > 12) {
        throw new BadRequestException('Month must be between 1 and 12');
      }

      if (year < 2000 || year > 2100) {
        throw new BadRequestException('Year must be between 2000 and 2100');
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const attendances = await this.teacherAttendanceModel
        .find({
          teacher: new Types.ObjectId(teacherId),
          date: { $gte: startDate, $lte: endDate },
          approvalStatus: 'approved'
        })
        .populate('teacherDetails', 'fullName email designation')
        .populate({
          path: 'attendanceDetails.class',
          select: 'classname'
        })
        .populate({
          path: 'attendanceDetails.batch',
          select: 'batchName sessionYear'
        })
        .populate({
          path: 'attendanceDetails.subject',
          select: 'subjectName subjectCode'
        })
        .sort({ date: 1 })
        .exec();

      // Calculate summary
      let totalClasses = 0;
      let attendedClasses = 0;
      let absentClasses = 0;
      const dailySummary: any[] = [];

      attendances.forEach(attendance => {
        totalClasses += attendance.totalClasses || 0;
        attendedClasses += attendance.attendedClasses || 0;
        absentClasses += attendance.absentClasses || 0;

        dailySummary.push({
          date: attendance.date,
          totalClasses: attendance.totalClasses || 0,
          attendedClasses: attendance.attendedClasses || 0,
          absentClasses: attendance.absentClasses || 0,
          details: attendance.attendanceDetails || []
        });
      });

      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      // Get teacher info from first attendance or create default
      let teacherInfo;
      if (attendances.length > 0 && attendances[0].teacherDetails) {
        const teacherDetails = attendances[0].teacherDetails as any;
        teacherInfo = {
          _id: teacherDetails._id?.toString() || '',
          fullName: teacherDetails.fullName || 'Unknown Teacher',
          email: teacherDetails.email || '',
          designation: teacherDetails.designation || ''
        };
      } else {
        teacherInfo = {
          _id: teacherId,
          fullName: 'Unknown Teacher',
          email: '',
          designation: ''
        };
      }

      return {
        teacher: teacherInfo,
        month,
        year,
        summary: {
          totalClasses,
          attendedClasses,
          absentClasses,
          attendanceRate
        },
        dailySummary,
        attendances: attendances.map(att => this.mapToResponseDto(att))
      };
    } catch (error) {
      console.error('Get monthly report error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate monthly report');
    }
  }

  async getMyAttendances(userId: string, filters?: any, pagination?: any) {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const query: any = { createdBy: new Types.ObjectId(userId) };
      
      if (filters?.teacher && Types.ObjectId.isValid(filters.teacher)) {
        query.teacher = new Types.ObjectId(filters.teacher);
      }
      if (filters?.startDate && filters?.endDate) {
        const startDateObj = new Date(filters.startDate);
        const endDateObj = new Date(filters.endDate);
        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj.setHours(23, 59, 59, 999);
          // FIXED: Using the correct variable names
          query.date = { $gte: startDateObj, $lte: endDateObj };
        }
      }
      if (filters?.approvalStatus) {
        query.approvalStatus = filters.approvalStatus;
      }
      if (filters?.search) {
        query.$or = [
          { submittedBy: { $regex: filters.search, $options: 'i' } },
          { approvalRemarks: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const { page = 1, limit = 10 } = pagination || {};
      const skip = (page - 1) * limit;

      const [attendances, total] = await Promise.all([
        this.teacherAttendanceModel
          .find(query)
          .populate('teacherDetails', 'fullName email designation')
          .populate('createdByUser', 'email username role name')
          .populate('updatedByUser', 'email username role name')
          .populate('approvedByUser', 'email username role name')
          .populate({
            path: 'attendanceDetails.class',
            select: 'classname'
          })
          .populate({
            path: 'attendanceDetails.batch',
            select: 'batchName sessionYear'
          })
          .populate({
            path: 'attendanceDetails.subject',
            select: 'subjectName subjectCode'
          })
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.teacherAttendanceModel.countDocuments(query).exec()
      ]);

      return {
        attendances: attendances.map((attendance: any) => this.mapToResponseDto(attendance)),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get my attendances error:', error);
      throw new InternalServerErrorException('Failed to fetch user attendances');
    }
  }

  async bulkCreate(attendanceData: CreateTeacherAttendanceDto[], userId: string): Promise<TeacherAttendanceResponseDto[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const createdAttendances: TeacherAttendanceResponseDto[] = [];
      const errors: any[] = [];

      for (const data of attendanceData) {
        try {
          // Validate teacher ID
          if (!Types.ObjectId.isValid(data.teacher)) {
            throw new BadRequestException(`Invalid teacher ID: ${data.teacher}`);
          }

          // Check for duplicate attendance
          const existingAttendance = await this.teacherAttendanceModel.findOne({
            teacher: new Types.ObjectId(data.teacher),
            date: data.date
          });

          if (existingAttendance) {
            throw new ConflictException(`Attendance already exists for teacher ${data.teacher} on ${data.date}`);
          }

          const attendance = new this.teacherAttendanceModel({
            ...data,
            teacher: new Types.ObjectId(data.teacher),
            attendanceDetails: data.attendanceDetails.map(detail => ({
              ...detail,
              class: new Types.ObjectId(detail.class),
              batch: new Types.ObjectId(detail.batch),
              subject: new Types.ObjectId(detail.subject)
            })),
            createdBy: new Types.ObjectId(userId)
          });

          const savedAttendance = await attendance.save();
          
          const populatedAttendance = await this.teacherAttendanceModel
            .findById(savedAttendance._id)
            .populate('teacherDetails', 'fullName email designation')
            .populate('createdByUser', 'email username role name')
            .exec();

          if (populatedAttendance) {
            createdAttendances.push(this.mapToResponseDto(populatedAttendance));
          }
        } catch (error: any) {
          errors.push({
            teacher: data.teacher,
            date: data.date,
            error: error.message
          });
        }
      }

      if (createdAttendances.length === 0 && errors.length > 0) {
        // Fixed: Create a detailed error message instead of passing array directly
        const errorDetails = errors
          .map((err, index) => `Error ${index + 1}: Teacher ${err.teacher} on ${err.date} - ${err.error}`)
          .join('; ');
        
        throw new BadRequestException(
          `Failed to create any attendance records. ${errorDetails}`
        );
      }

      return createdAttendances;
    } catch (error) {
      console.error('Bulk create error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create bulk attendance records');
    }
  }
}