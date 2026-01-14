import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, UsePipes, ValidationPipe, HttpCode, HttpStatus,
  Req, UseGuards, ParseIntPipe 
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherResponseDto } from './dto/teacher-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UseFilters } from '@nestjs/common';
import type { Request } from 'express';
import { TeacherStatus } from './schemas/teacher.schema';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async create(
    @Body() createTeacherDto: CreateTeacherDto,
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.teacherService.create(createTeacherDto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('designation') designation?: string,
    @Query('assignType') assignType?: string,
    @Query('status') status?: TeacherStatus,
    @Query('isActive') isActive?: string,
    @Query('gender') gender?: string,
    @Query('religion') religion?: string,
    @Query('bloodGroup') bloodGroup?: string,
    @Query('createdBy') createdBy?: string
  ): Promise<{ 
    teachers: TeacherResponseDto[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  }> {
    const query = {
      page,
      limit,
      search,
      designation,
      assignType,
      status,
      isActive,
      gender,
      religion,
      bloodGroup,
      createdBy
    };
    return this.teacherService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findOne(@Param('id') id: string): Promise<TeacherResponseDto> {
    return this.teacherService.findOne(id);
  }

  @Get('email/:email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async findByEmail(
    @Param('email') email: string
  ): Promise<TeacherResponseDto> {
    return this.teacherService.findByEmail(email);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.update(id, updateTeacherDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.teacherService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TeacherStatus; isActive: boolean },
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.updateStatus(id, body.status, body.isActive, userId);
  }

  @Patch(':id/verify-email')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async verifyEmail(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.verifyEmail(id, userId);
  }

  @Patch(':id/verify-phone')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async verifyPhone(
    @Param('id') id: string,
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.verifyPhone(id, userId);
  }

  @Patch(':id/change-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  async changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @Req() req: Request
  ): Promise<TeacherResponseDto> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.changePassword(id, body.newPassword, userId);
  }

  @Get('statistics/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getStatistics(@Req() req: Request): Promise<any> {
    const user = req.user as any;
    const userId = user?._id;
    return this.teacherService.getStatistics(userId);
  }

  @Get('my-teachers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  async getMyTeachers(
    @Req() req: Request,
    @Query('status') status?: TeacherStatus,
    @Query('isActive') isActive?: string,
    @Query('designation') designation?: string,
    @Query('assignType') assignType?: string,
    @Query('gender') gender?: string,
    @Query('religion') religion?: string,
    @Query('bloodGroup') bloodGroup?: string,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<{
    teachers: TeacherResponseDto[];
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
    if (designation) filters.designation = designation;
    if (assignType) filters.assignType = assignType;
    if (gender) filters.gender = gender;
    if (religion) filters.religion = religion;
    if (bloodGroup) filters.bloodGroup = bloodGroup;
    if (search) filters.search = search;

    const result = await this.teacherService.getMyTeachers(
      user._id, 
      filters, 
      { page, limit }
    );
    
    return {
      teachers: result.teachers,
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

    const [total, active, statistics] = await Promise.all([
      this.teacherService.countTeachersByUser(user._id),
      this.teacherService.countActiveTeachersByUser(user._id),
      this.teacherService.getStatistics(user._id),
    ]);

    return {
      totalTeachers: total,
      activeTeachers: active,
      inactiveTeachers: total - active,
      verifiedEmail: statistics.verifiedEmail || 0,
      verifiedPhone: statistics.verifiedPhone || 0,
      byDesignation: statistics.byDesignation || [],
      byAssignType: statistics.byAssignType || [],
      byStatus: statistics.byStatus || [],
      byGender: statistics.byGender || [],
      byReligion: statistics.byReligion || [],
      byBloodGroup: statistics.byBloodGroup || [],
    };
  }

  // @Get('search/by-national-id/:nationalId')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  // async findByNationalId(
  //   @Param('nationalId') nationalId: string
  // ): Promise<TeacherResponseDto> {
  //   const teacher = await this.teacherService.findOneByNationalId(nationalId);
  //   if (!teacher) {
  //     throw new NotFoundException(`Teacher with National ID ${nationalId} not found`);
  //   }
  //   return teacher;
  // }
}