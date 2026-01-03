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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';
import { ExamResponseDto, ExamListResponseDto } from './dto/exam-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import { UserRole } from '../../shared/interfaces/user.interface';
import { Roles } from '../../auth/decorators/roles.decorator';
import { IExamStats } from './interfaces/exam.interface';
import { ExamCategory, ExamStatus } from './exam.schema';

@ApiTags('exams')
@ApiBearerAuth('JWT-auth')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exam created successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam overlaps with existing exam',
    schema: {
      example: {
        statusCode: 409,
        message: 'Exam overlaps with existing exam for selected batches',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['examName must be a string', 'class must be a valid MongoDB ID'],
        error: 'Bad Request',
      },
    },
  })
  async create(
    @Body() createExamDto: CreateExamDto,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user._id;
    const exam = await this.examService.create(createExamDto, userId);
    return this.serializeExam(exam);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all exams with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of exams',
    type: ExamListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'class', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'batch', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: ['midterm', 'final', 'quiz', 'assignment', 'practical'] })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'createdBy', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  async findAll(@Query() query: ExamQueryDto): Promise<ExamListResponseDto> {
    const result = await this.examService.findAll(query);
    const data = result.data.map((exam) => this.serializeExam(exam));
    
    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get exam statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam statistics',
  })
  async getStats(): Promise<IExamStats> {
    return await this.examService.getStats();
  }

  @Get('upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get upcoming exams' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of upcoming exams',
    type: [ExamResponseDto],
  })
  async getUpcomingExams(@Query('limit') limit?: number): Promise<ExamResponseDto[]> {
    const exams = await this.examService.getUpcomingExams(limit);
    return exams.map((exam) => this.serializeExam(exam));
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get an exam by ID' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam details',
    type: ExamResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam not found',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<ExamResponseDto> {
    const exam = await this.examService.findOne(id);
    return this.serializeExam(exam);
  }

  @Get('batch/:batchId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get exams by batch ID' })
  @ApiParam({
    name: 'batchId',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getExamsByBatch(
    @Param('batchId') batchId: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ExamListResponseDto> {
    const query = { status, isActive, page, limit };
    const result = await this.examService.getExamsByBatch(batchId, query);
    const data = result.data.map((exam) => this.serializeExam(exam));
    
    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('class/:classId/subject/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get exams by class and subject' })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'subjectId',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of exams for class and subject',
    type: [ExamResponseDto],
  })
  async getExamsByClassAndSubject(
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
  ): Promise<ExamResponseDto[]> {
    const exams = await this.examService.getExamsByClassAndSubject(classId, subjectId);
    return exams.map((exam) => this.serializeExam(exam));
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update an exam' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam updated successfully',
    type: ExamResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam overlaps with existing exam',
  })
  async update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user._id;
    const exam = await this.examService.update(id, updateExamDto, userId);
    return this.serializeExam(exam);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle exam active status' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam status toggled successfully',
    type: ExamResponseDto,
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user._id;
    const exam = await this.examService.toggleStatus(id, userId);
    return this.serializeExam(exam);
  }

  @Patch(':id/status/:status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update exam status' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'status',
    description: 'New status',
    enum: ExamStatus,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam status updated successfully',
    type: ExamResponseDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: ExamStatus,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user._id;
    const exam = await this.examService.updateExamStatus(id, status, userId);
    return this.serializeExam(exam);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exam' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Exam deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.examService.remove(id);
  }

  /**
   * Serialize Mongoose document to ExamResponseDto
   */
  private serializeExam(exam: any): ExamResponseDto {
    if (!exam) {
      // Return a default empty ExamResponseDto instead of null
      return this.getEmptyExamResponseDto();
    }

    const plainExam = exam.toObject ? exam.toObject({ virtuals: true }) : exam;
    
    // Calculate additional fields
    const now = new Date();
    const startTime = new Date(plainExam.startTime);
    const endTime = new Date(plainExam.endTime);
    const examDate = new Date(plainExam.examDate);
    
    const durationInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const daysRemaining = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isUpcoming = examDate > now;
    const isOngoing = startTime <= now && endTime >= now;
    const isCompleted = endTime < now;

    // Helper to safely extract populated references
    const safeRef = (obj: any, idField: string, nameField: string) => {
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

    const safeArrayRef = (arr: any[], idField: string, nameField: string) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map(item => {
        if (typeof item === 'string') return item;
        if (item._id) {
          return {
            _id: item._id.toString(),
            [nameField]: item[nameField] || '',
          };
        }
        return item.toString();
      });
    };

    const safeUserRef = (user: any) => {
      if (!user) return '';
      if (typeof user === 'string') return user;
      if (user._id) {
        return {
          _id: user._id.toString(),
          username: user.username || '',
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        };
      }
      return user.toString();
    };

    return {
      _id: plainExam._id.toString(),
      examName: plainExam.examName,
      class: safeRef(plainExam.class, '_id', 'classname'),
      subject: safeRef(plainExam.subject, '_id', 'subjectName'),
      batches: safeArrayRef(plainExam.batches, '_id', 'batchName'),
      category: plainExam.category,
      examDate: plainExam.examDate,
      startTime: plainExam.startTime,
      endTime: plainExam.endTime,
      showMarksInResult: plainExam.showMarksInResult,
      marksDistribution: plainExam.marksDistribution || [],
      totalMarks: plainExam.totalMarks || 0,
      enableGrading: plainExam.enableGrading || false,
      gradingSystem: plainExam.gradingSystem || [],
      passMarks: plainExam.passMarks || 40,
      status: plainExam.status,
      isActive: plainExam.isActive !== undefined ? plainExam.isActive : true,
      instructions: plainExam.instructions,
      location: plainExam.location,
      createdBy: safeUserRef(plainExam.createdBy),
      updatedBy: plainExam.updatedBy ? safeUserRef(plainExam.updatedBy) : undefined,
      createdAt: plainExam.createdAt,
      updatedAt: plainExam.updatedAt,
      durationInMinutes,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      isUpcoming,
      isOngoing,
      isCompleted,
    };
  }

  /**
   * Returns an empty ExamResponseDto as fallback
   */
  private getEmptyExamResponseDto(): ExamResponseDto {
    return {
      _id: '',
      examName: '',
      class: '',
      subject: '',
      batches: [],
      category: ExamCategory.MIDTERM,
      examDate: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      showMarksInResult: true,
      marksDistribution: [],
      totalMarks: 0,
      enableGrading: false,
      gradingSystem: [],
      passMarks: 40,
      status: ExamStatus.DRAFT,
      isActive: true,
      instructions: '',
      location: '',
      createdBy: '',
      updatedBy: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      durationInMinutes: 0,
      daysRemaining: 0,
      isUpcoming: false,
      isOngoing: false,
      isCompleted: false,
    };
  }
}