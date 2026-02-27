// src/result-management/exam/exam.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import type { Request } from 'express';

@ApiTags('academic/exam')
@ApiBearerAuth('JWT-auth')
@Controller('academic/exam')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiBody({ type: CreateExamDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exam created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        examName: 'tet',
        topicName: 'adca',
        className: 'HSC 2027',
        batchName: 'SUN-3PM',
        subjectName: 'Mathematics',
        examCategory: 'Class Test',
        examDate: '2026-01-16T00:00:00.000Z',
        showMarksTitle: true,
        marksFields: [
          {
            type: 'mcq',
            totalMarks: 30,
            enablePassMarks: true,
            passMarks: 15,
            enableNegativeMarking: true,
            negativeMarks: 0.5
          },
          {
            type: 'cq',
            totalMarks: 40,
            enablePassMarks: false,
            enableNegativeMarking: false
          },
          {
            type: 'written',
            totalMarks: 30,
            enablePassMarks: true,
            passMarks: 15,
            enableNegativeMarking: false
          }
        ],
        totalMarks: 100,
        enableGrading: true,
        totalPassMarks: 40,
        showPercentageInResult: true,
        showGPAInResult: false,
        useGPASystem: false,
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439025',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'teacher'
        },
        createdAt: '2024-12-01T10:30:00.000Z',
        updatedAt: '2024-12-01T10:30:00.000Z',
      },
    },
  })
  create(
    @Body() dto: CreateExamDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    
    return this.examService.create(dto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all exams with filtering and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by exam name or topic',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'className',
    required: false,
    type: String,
    description: 'Filter by class name',
  })
  @ApiQuery({
    name: 'subjectName',
    required: false,
    type: String,
    description: 'Filter by subject name',
  })
  @ApiQuery({
    name: 'examCategory',
    required: false,
    type: String,
    description: 'Filter by exam category',
  })
  @ApiQuery({
    name: 'batchName',
    required: false,
    type: String,
    description: 'Filter by batch name',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter exams from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter exams to date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
    example: 'examDate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of exams',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            examName: 'tet',
            topicName: 'adca',
            className: 'HSC 2027',
            batchName: 'SUN-3PM',
            subjectName: 'Mathematics',
            examCategory: 'Class Test',
            examDate: '2026-01-16T00:00:00.000Z',
            showMarksTitle: true,
            marksFields: [
              {
                type: 'mcq',
                totalMarks: 30,
                enablePassMarks: true,
                passMarks: 15,
                enableNegativeMarking: true,
                negativeMarks: 0.5
              },
              {
                type: 'cq',
                totalMarks: 40,
                enablePassMarks: false,
                enableNegativeMarking: false
              },
              {
                type: 'written',
                totalMarks: 30,
                enablePassMarks: true,
                passMarks: 15,
                enableNegativeMarking: false
              }
            ],
            totalMarks: 100,
            enableGrading: true,
            totalPassMarks: 40,
            showPercentageInResult: true,
            showGPAInResult: false,
            useGPASystem: false,
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439025',
              email: 'teacher@example.com',
              username: 'teacher',
              role: 'teacher'
            },
            createdAt: '2024-12-01T10:30:00.000Z',
            updatedAt: '2024-12-01T10:30:00.000Z',
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('className') className?: string,
    @Query('subjectName') subjectName?: string,
    @Query('examCategory') examCategory?: string,
    @Query('batchName') batchName?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const query = {
      search,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      className,
      subjectName,
      examCategory,
      batchName,
      fromDate,
      toDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'examDate',
      sortOrder: sortOrder || 'desc',
    };
    return this.examService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get an exam by ID' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam details',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        examName: 'tet',
        topicName: 'adca',
        className: 'HSC 2027',
        batchName: 'SUN-3PM',
        subjectName: 'Mathematics',
        examCategory: 'Class Test',
        examDate: '2026-01-16T00:00:00.000Z',
        showMarksTitle: true,
        marksFields: [
          {
            type: 'mcq',
            totalMarks: 30,
            enablePassMarks: true,
            passMarks: 15,
            enableNegativeMarking: true,
            negativeMarks: 0.5
          },
          {
            type: 'cq',
            totalMarks: 40,
            enablePassMarks: false,
            enableNegativeMarking: false
          },
          {
            type: 'written',
            totalMarks: 30,
            enablePassMarks: true,
            passMarks: 15,
            enableNegativeMarking: false
          }
        ],
        totalMarks: 100,
        enableGrading: true,
        totalPassMarks: 40,
        showPercentageInResult: true,
        showGPAInResult: false,
        useGPASystem: false,
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439025',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'teacher'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439026',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        createdAt: '2024-12-01T10:30:00.000Z',
        updatedAt: '2024-12-02T11:30:00.000Z',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.examService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update an exam' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateExamDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        examName: 'Updated Exam',
        topicName: 'Updated Topic',
        className: 'Updated Class',
        batchName: 'Updated Batch',
        subjectName: 'Updated Subject',
        examCategory: 'Updated Category',
        examDate: '2026-01-17T00:00:00.000Z',
        showMarksTitle: false,
        marksFields: [],
        totalMarks: 120,
        enableGrading: false,
        totalPassMarks: null,
        showPercentageInResult: false,
        showGPAInResult: false,
        useGPASystem: false,
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439025',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'teacher'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439026',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        createdAt: '2024-12-01T10:30:00.000Z',
        updatedAt: '2024-12-02T15:45:00.000Z',
      },
    },
  })
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateExamDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.examService.update(id, dto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
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
  remove(@Param('id') id: string) {
    return this.examService.remove(id);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Toggle exam active status' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam active status toggled successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        examName: 'tet',
        isActive: false,
        createdBy: {
          _id: '507f1f77bcf86cd799439025',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'teacher'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439026',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        message: 'Exam status updated successfully',
      },
    },
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.examService.toggleActive(id, user._id);
  }

  @Get('suggestions/classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get unique class name suggestions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of unique class names',
    schema: {
      example: ['HSC 2027', 'SSC 2025', 'Class 9', 'Class 10'],
    },
  })
  async getClassSuggestions() {
    const exams = await this.examService.findAll({ limit: 1000 });
    const classes = [...new Set(exams.data.map(exam => exam.className).filter(Boolean))];
    return classes.sort();
  }

  @Get('suggestions/batches')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get unique batch name suggestions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of unique batch names',
    schema: {
      example: ['SUN-3PM', 'MON-10AM', 'WED-2PM'],
    },
  })
  async getBatchSuggestions() {
    const exams = await this.examService.findAll({ limit: 1000 });
    const batches = [...new Set(exams.data.map(exam => exam.batchName).filter(Boolean))];
    return batches.sort();
  }

  @Get('suggestions/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get unique subject name suggestions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of unique subject names',
    schema: {
      example: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    },
  })
  async getSubjectSuggestions() {
    const exams = await this.examService.findAll({ limit: 1000 });
    const subjects = [...new Set(exams.data.map(exam => exam.subjectName).filter(Boolean))];
    return subjects.sort();
  }

  @Get('suggestions/categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get unique exam category suggestions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of unique exam categories',
    schema: {
      example: ['Class Test', 'Monthly Test', 'Terminal Exam', 'Final Exam'],
    },
  })
  async getCategorySuggestions() {
    const exams = await this.examService.findAll({ limit: 1000 });
    const categories = [...new Set(exams.data.map(exam => exam.examCategory).filter(Boolean))];
    return categories.sort();
  }
}