import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { StudentAttendanceListResponseDto, StudentAttendanceResponseDto } from './dto/student-attendance-response.dto';
import { StudentAttendanceQueryDto } from './dto/student-attendance-query.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { StudentAttendanceService } from './student-attendance.service';

@ApiTags('academic/student-attendance')
@ApiBearerAuth('JWT-auth')
@Controller('academic/student-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class StudentAttendanceController {
  constructor(private readonly service: StudentAttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create student attendance (class + batch + date)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attendance created successfully',
    type: StudentAttendanceResponseDto,
  })
  async create(
    @Body() dto: CreateStudentAttendanceDto,
    @Req() req: any,
  ): Promise<StudentAttendanceResponseDto> {
    const userId = req.user?._id;
    const doc = await this.service.create(dto, userId);
    return this.serialize(doc);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'List attendance with filtering + pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance list',
    type: StudentAttendanceListResponseDto,
  })
  async findAll(
    @Query() query: StudentAttendanceQueryDto,
  ): Promise<StudentAttendanceListResponseDto> {
    const result = await this.service.findAll(query);
    return {
      data: result.data.map((d) => this.serialize(d)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance by ID' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance details',
    type: StudentAttendanceResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<StudentAttendanceResponseDto> {
    const doc = await this.service.findOne(id);
    return this.serialize(doc);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update attendance by ID' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance updated successfully',
    type: StudentAttendanceResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentAttendanceDto,
    @Req() req: any,
  ): Promise<StudentAttendanceResponseDto> {
    const userId = req.user?._id;
    const doc = await this.service.update(id, dto, userId);
    return this.serialize(doc);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attendance by ID' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439013' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }

  /**
   * Serialize Mongoose document to StudentAttendanceResponseDto
   */
  private serialize(doc: any): StudentAttendanceResponseDto {
    const plain = doc?.toObject ? doc.toObject({ virtuals: true }) : doc;

    const safeRef = (obj: any, nameField: string) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      if (obj._id) {
        return {
          _id: obj._id.toString(),
          [nameField]: obj[nameField] || '',
        };
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

    return {
      _id: plain._id.toString(),
      class: safeRef(plain.class, 'classname'),
      batch: safeRef(plain.batch, 'batchName'),
      attendanceDate: plain.attendanceDate,
      classStartTime: plain.classStartTime,
      classEndTime: plain.classEndTime,
      attendanceType: plain.attendanceType,
      remarks: plain.remarks,
      isActive: plain.isActive ?? true,
      createdBy: safeUser(plain.createdBy) ?? '',
      updatedBy: safeUser(plain.updatedBy),
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }
}