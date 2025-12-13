import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, UsePipes, ValidationPipe, HttpCode, HttpStatus,
  Req, UseGuards
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UseFilters } from '@nestjs/common';
import type { Request } from 'express';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @Req() req: Request
  ): Promise<StudentResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.studentService.create(createStudentDto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findAll(@Query() query: any): Promise<StudentResponseDto[]> {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentService.findOne(id);
  }

  @Get('registration/:registrationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findByRegistrationId(
    @Param('registrationId') registrationId: string
  ): Promise<StudentResponseDto> {
    return this.studentService.findByRegistrationId(registrationId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: Request
  ): Promise<StudentResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.studentService.update(id, updateStudentDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; isActive: boolean },
    @Req() req: Request
  ): Promise<StudentResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.studentService.updateStatus(id, body.status, body.isActive, userId);
  }

  @Post(':id/payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async makePayment(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Req() req: Request
  ): Promise<StudentResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.studentService.makePayment(id, body.amount, userId);
  }

  @Get('statistics/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getStatistics(@Req() req: Request): Promise<any> {
    const user = req.user as any;
    const userId = user?._id;
    return this.studentService.getStatistics(userId);
  }

  @Get('my-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getMyStudents(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('batchId') batchId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    students: StudentResponseDto[];
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
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    if (classId) filters.classId = classId;
    if (batchId) filters.batchId = batchId;

    const result = await this.studentService.getMyStudents(
      user._id, 
      filters, 
      { page: page || 1, limit: limit || 10 }
    );
    
    return {
      students: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('my-stats/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getMyStatsSummary(@Req() req: Request): Promise<any> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }

    const [total, active, dueAmount] = await Promise.all([
      this.studentService.countStudentsByUser(user._id),
      this.studentService.countActiveStudentsByUser(user._id),
      this.studentService.getStatistics(user._id),
    ]);

    return {
      totalStudents: total,
      activeStudents: active,
      inactiveStudents: total - active,
      totalDueAmount: dueAmount.totalDueAmount || 0,
      duePayments: dueAmount.duePayments || 0,
      monthlyStudents: dueAmount.monthlyStudents || 0,
    };
  }
}