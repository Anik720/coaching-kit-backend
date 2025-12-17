// attendance/teacher-attendance.controller.ts
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, UsePipes, ValidationPipe, HttpCode, HttpStatus,
  Req, UseGuards 
} from '@nestjs/common';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';
import { ApproveAttendanceDto } from './dto/approve-attendance.dto';
import { TeacherAttendanceResponseDto } from './dto/teacher-attendance-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UseFilters } from '@nestjs/common';
import type { Request } from 'express';

@Controller('teacher-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class TeacherAttendanceController {
  constructor(private readonly teacherAttendanceService: TeacherAttendanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async create(
    @Body() createAttendanceDto: CreateTeacherAttendanceDto,
    @Req() req: Request
  ): Promise<TeacherAttendanceResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.teacherAttendanceService.create(createAttendanceDto, user._id);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async bulkCreate(
    @Body() attendanceData: CreateTeacherAttendanceDto[],
    @Req() req: Request
  ): Promise<TeacherAttendanceResponseDto[]> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.teacherAttendanceService.bulkCreate(attendanceData, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findAll(@Query() query: any): Promise<TeacherAttendanceResponseDto[]> {
    return this.teacherAttendanceService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findOne(@Param('id') id: string): Promise<TeacherAttendanceResponseDto> {
    return this.teacherAttendanceService.findOne(id);
  }

  @Get('teacher/:teacherId/date/:date')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findByTeacherAndDate(
    @Param('teacherId') teacherId: string,
    @Param('date') date: string
  ): Promise<TeacherAttendanceResponseDto[]> {
    return this.teacherAttendanceService.findByTeacherAndDate(teacherId, date);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateTeacherAttendanceDto,
    @Req() req: Request
  ): Promise<TeacherAttendanceResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherAttendanceService.update(id, updateAttendanceDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.teacherAttendanceService.remove(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveAttendanceDto,
    @Req() req: Request
  ): Promise<TeacherAttendanceResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.teacherAttendanceService.approveAttendance(id, approveDto, user._id);
  }

  @Get('statistics/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getStatistics(@Query() query: any, @Req() req: Request): Promise<any> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherAttendanceService.getStatistics(query, userId);
  }

  @Get('report/monthly/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getMonthlyReport(
    @Param('teacherId') teacherId: string,
    @Query('month') month: number,
    @Query('year') year: number
  ): Promise<any> {
    if (!month || !year) {
      const now = new Date();
      month = month || now.getMonth() + 1;
      year = year || now.getFullYear();
    }
    return this.teacherAttendanceService.getMonthlyReport(teacherId, month, year);
  }

  @Get('my-attendances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getMyAttendances(
    @Req() req: Request,
    @Query('teacher') teacher?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('approvalStatus') approvalStatus?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    attendances: TeacherAttendanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }

    const filters: any = {};
    if (teacher) filters.teacher = teacher;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (approvalStatus) filters.approvalStatus = approvalStatus;
    if (search) filters.search = search;

    const result = await this.teacherAttendanceService.getMyAttendances(
      user._id, 
      filters, 
      { page: page || 1, limit: limit || 10 }
    );
    
    return {
      attendances: result.attendances,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('dashboard/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getDashboardSummary(@Req() req: Request): Promise<any> {
    const user = req.user as any;
    const userId = user?._id;
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const [todayAttendances, pendingApprovals, recentApprovals] = await Promise.all([
      this.teacherAttendanceService.getStatistics({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      }, userId),
      this.teacherAttendanceService.findAll({
        approvalStatus: 'submitted',
        limit: 5
      }),
      this.teacherAttendanceService.findAll({
        approvalStatus: 'approved',
        limit: 10,
        page: 1
      })
    ]);

    return {
      today: {
        totalAttendances: todayAttendances.totalAttendances,
        totalClasses: todayAttendances.totalClasses,
        attendanceRate: todayAttendances.attendanceRate
      },
      pendingApprovals: pendingApprovals.length,
      recentApprovals: recentApprovals
    };
  }
}