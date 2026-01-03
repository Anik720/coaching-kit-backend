import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseFilters,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentAttendanceListService } from './student-attendance-list.service';
import { CreateStudentAttendanceListDto } from './dto/create-student-attendance-list.dto';
import { UpdateStudentAttendanceListDto } from './dto/update-student-attendance-list.dto';
import { StudentAttendanceListQueryDto } from './dto/student-attendance-list-query.dto';
import {
  StudentAttendanceListResponseDto,
  StudentAttendanceListListResponseDto,
  StudentAttendanceListBulkResponseDto,
  StudentAttendanceListStatsDto,
} from './dto/student-attendance-list-response.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('academic/student-attendance-list')
@ApiBearerAuth('JWT-auth')
@Controller('academic/student-attendance-list')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class StudentAttendanceListController {
  constructor(private readonly attendanceListService: StudentAttendanceListService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a student attendance record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attendance created successfully',
    type: StudentAttendanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Attendance already exists for this student, class, batch and date',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async create(
    @Body() createDto: CreateStudentAttendanceListDto,
    @Req() req: any,
  ): Promise<StudentAttendanceListResponseDto> {
    const userId = req.user._id;
    const attendance = await this.attendanceListService.create(createDto, userId);
    return this.serializeAttendance(attendance);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create multiple student attendance records in bulk' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk attendance created successfully',
    type: StudentAttendanceListBulkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async createBulk(
    @Body() createDtos: CreateStudentAttendanceListDto[],
    @Req() req: any,
  ): Promise<StudentAttendanceListBulkResponseDto> {
    const userId = req.user._id;
    const result = await this.attendanceListService.createBulk(createDtos, userId);
    
    return {
      data: result.data.map((attendance) => this.serializeAttendance(attendance)),
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors,
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all student attendance records with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of attendance records',
    type: StudentAttendanceListListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async findAll(
    @Query() query: StudentAttendanceListQueryDto,
    @Query('includeStats') includeStats?: string,
  ): Promise<StudentAttendanceListListResponseDto> {
    const result = await this.attendanceListService.findAll(query);
    const data = result.data.map((attendance) => this.serializeAttendance(attendance));
    
    let stats: StudentAttendanceListStatsDto | undefined;
    if (includeStats === 'true') {
      stats = await this.attendanceListService.getAttendanceStats({
        class: query.class,
        batch: query.batch,
        date: query.date,
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }
    
    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats,
    };
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get attendance statistics' })
  @ApiQuery({ name: 'class', required: false, description: 'Class ID' })
  @ApiQuery({ name: 'batch', required: false, description: 'Batch ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Specific date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance statistics',
    type: StudentAttendanceListStatsDto,
  })
  async getStats(
    @Query('class') classId?: string,
    @Query('batch') batchId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StudentAttendanceListStatsDto> {
    return await this.attendanceListService.getAttendanceStats({
      class: classId,
      batch: batchId,
      date,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a student attendance record by ID' })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance details',
    type: StudentAttendanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attendance not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string): Promise<StudentAttendanceListResponseDto> {
    const attendance = await this.attendanceListService.findOne(id);
    return this.serializeAttendance(attendance);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a student attendance record' })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance updated successfully',
    type: StudentAttendanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attendance not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Attendance already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentAttendanceListDto,
    @Req() req: any,
  ): Promise<StudentAttendanceListResponseDto> {
    const userId = req.user._id;
    const attendance = await this.attendanceListService.update(id, updateDto, userId);
    return this.serializeAttendance(attendance);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student attendance record' })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Attendance deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attendance not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.attendanceListService.remove(id);
  }

  @Get('date-range/:classId/:batchId/:startDate/:endDate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance records for a class and batch within a date range' })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'batchId',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiParam({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @ApiParam({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance records within date range',
    type: [StudentAttendanceListResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getByDateRange(
    @Param('classId') classId: string,
    @Param('batchId') batchId: string,
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<StudentAttendanceListResponseDto[]> {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    const attendances = await this.attendanceListService.getAttendanceByDateRange(
      classId,
      batchId,
      start,
      end,
    );
    return attendances.map((attendance) => this.serializeAttendance(attendance));
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Toggle attendance active status' })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance status toggled successfully',
    type: StudentAttendanceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attendance not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<StudentAttendanceListResponseDto> {
    const userId = req.user._id;
    const attendance = await this.attendanceListService.toggleActive(id, userId);
    return this.serializeAttendance(attendance);
  }

  /**
   * Serialize Mongoose document to StudentAttendanceListResponseDto
   */
  private serializeAttendance(attendance: any): StudentAttendanceListResponseDto {
    const plainAttendance = attendance.toObject
      ? attendance.toObject({ virtuals: true })
      : attendance;

    // Helper to safely extract populated ref
    const safeRef = (obj: any, idField: string, nameField: string, additionalFields: string[] = []) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      if (obj._id) {
        const result: any = {
          _id: obj._id.toString(),
          [nameField]: obj[nameField] || '',
        };
        
        additionalFields.forEach(field => {
          if (obj[field] !== undefined) {
            result[field] = obj[field];
          }
        });
        
        return result;
      }
      return obj.toString();
    };

    const safeUser = (obj: any) => {
      if (!obj) return undefined;
      if (typeof obj === 'string') return obj;
      if (obj._id) {
        return {
          _id: obj._id.toString(),
          username: obj.username || '',
          email: obj.email || '',
        };
      }
      return obj.toString();
    };

    const classResponse = safeRef(plainAttendance.class, '_id', 'classname');
    const batchResponse = safeRef(plainAttendance.batch, '_id', 'batchName');
    const studentResponse = safeRef(
      plainAttendance.student,
      '_id',
      'firstName',
      ['lastName', 'studentId']
    );

    // Create full name for student
    let studentWithFullName = studentResponse;
    if (typeof studentResponse === 'object' && studentResponse._id) {
      studentResponse.fullName = `${studentResponse.firstName || ''} ${studentResponse.lastName || ''}`.trim();
    }

    return {
      _id: plainAttendance._id.toString(),
      class: classResponse,
      batch: batchResponse,
      student: studentResponse,
      attendanceDate: plainAttendance.attendanceDate,
      status: plainAttendance.status,
      vitalTherm: plainAttendance.vitalTherm,
      vitalPerm: plainAttendance.vitalPerm,
      vitalAsem: plainAttendance.vitalAsem,
      begin: plainAttendance.begin,
      remarks: plainAttendance.remarks,
      isActive: plainAttendance.isActive ?? true,
      createdBy: safeUser(plainAttendance.createdBy) || '',
      updatedBy: safeUser(plainAttendance.updatedBy),
      createdAt: plainAttendance.createdAt,
      updatedAt: plainAttendance.updatedAt,
    };
  }
}