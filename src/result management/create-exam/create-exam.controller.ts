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
        examName: 'Mid-Term Examination 2025',
        topicName: 'Algebra & Geometry',
        class: {
          _id: '507f1f77bcf86cd799439021',
          classname: 'Class 10',
          description: 'Tenth standard'
        },
        batches: [
          {
            _id: '507f1f77bcf86cd799439022',
            batchName: 'Morning Batch',
            sessionYear: '2024-2025'
          }
        ],
        subject: {
          _id: '507f1f77bcf86cd799439023',
          subjectName: 'Mathematics',
          subjectCode: 'MATH101'
        },
        examCategory: {
          _id: '507f1f77bcf86cd799439024',
          categoryName: 'Quarterly Exams'
        },
        examDate: '2024-12-25T00:00:00.000Z',
        showMarksTitle: true,
        selectedMarksFields: ['mcq', 'cq', 'written'],
        totalMarks: 100,
        enableGrading: true,
        passMarks: 40,
        showPercentageInResult: true,
        showGPAInResult: false,
        useGPASystem: false,
        instructions: 'Bring calculator and geometry set',
        duration: 180,
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'examName must be a string',
          'classId must be a mongodb id',
          'Pass marks cannot exceed total marks'
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Exam with this name already exists for this class and subject',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  create(
    @Body() dto: CreateExamDto,
    @Req() req: Request
  ) {
    console.log('=== Exam Controller Debug ===');
    console.log('Request user object:', req.user);
    console.log('User ID from request:', (req.user as any)?._id);
    
    const user = req.user as any;
    
    if (!user || !user._id) {
      console.error('ERROR: No user or user._id found in request');
      throw new Error('User authentication failed - no user ID found');
    }
    
    console.log('Passing userId to service:', user._id);
    console.log('=== End Controller Debug ===');
    
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
    name: 'classId',
    required: false,
    type: String,
    description: 'Filter by class ID',
  })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    type: String,
    description: 'Filter by subject ID',
  })
  @ApiQuery({
    name: 'examCategoryId',
    required: false,
    type: String,
    description: 'Filter by exam category ID',
  })
  @ApiQuery({
    name: 'batchId',
    required: false,
    type: String,
    description: 'Filter by batch ID',
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
            examName: 'Mid-Term Examination 2025',
            topicName: 'Algebra & Geometry',
            class: {
              _id: '507f1f77bcf86cd799439021',
              classname: 'Class 10',
              description: 'Tenth standard'
            },
            batches: [
              {
                _id: '507f1f77bcf86cd799439022',
                batchName: 'Morning Batch',
                sessionYear: '2024-2025'
              }
            ],
            subject: {
              _id: '507f1f77bcf86cd799439023',
              subjectName: 'Mathematics',
              subjectCode: 'MATH101'
            },
            examCategory: {
              _id: '507f1f77bcf86cd799439024',
              categoryName: 'Quarterly Exams'
            },
            examDate: '2024-12-25T00:00:00.000Z',
            showMarksTitle: true,
            selectedMarksFields: ['mcq', 'cq', 'written'],
            totalMarks: 100,
            enableGrading: true,
            passMarks: 40,
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
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examCategoryId') examCategoryId?: string,
    @Query('batchId') batchId?: string,
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
      classId,
      subjectId,
      examCategoryId,
      batchId,
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
        examName: 'Mid-Term Examination 2025',
        topicName: 'Algebra & Geometry',
        class: {
          _id: '507f1f77bcf86cd799439021',
          classname: 'Class 10',
          description: 'Tenth standard',
          isActive: true
        },
        batches: [
          {
            _id: '507f1f77bcf86cd799439022',
            batchName: 'Morning Batch',
            sessionYear: '2024-2025',
            isActive: true
          }
        ],
        subject: {
          _id: '507f1f77bcf86cd799439023',
          subjectName: 'Mathematics',
          subjectCode: 'MATH101',
          isActive: true
        },
        examCategory: {
          _id: '507f1f77bcf86cd799439024',
          categoryName: 'Quarterly Exams',
          isActive: true
        },
        examDate: '2024-12-25T00:00:00.000Z',
        showMarksTitle: true,
        selectedMarksFields: ['mcq', 'cq', 'written'],
        totalMarks: 100,
        enableGrading: true,
        passMarks: 40,
        showPercentageInResult: true,
        showGPAInResult: false,
        useGPASystem: false,
        instructions: 'Bring calculator and geometry set',
        duration: 180,
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
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
        examName: 'Updated Mid-Term Examination 2025',
        topicName: 'Updated Algebra & Geometry',
        class: {
          _id: '507f1f77bcf86cd799439021',
          classname: 'Class 10',
          description: 'Tenth standard'
        },
        batches: [
          {
            _id: '507f1f77bcf86cd799439022',
            batchName: 'Morning Batch',
            sessionYear: '2024-2025'
          },
          {
            _id: '507f1f77bcf86cd799439027',
            batchName: 'Evening Batch',
            sessionYear: '2024-2025'
          }
        ],
        subject: {
          _id: '507f1f77bcf86cd799439023',
          subjectName: 'Mathematics',
          subjectCode: 'MATH101'
        },
        examCategory: {
          _id: '507f1f77bcf86cd799439024',
          categoryName: 'Quarterly Exams'
        },
        examDate: '2024-12-26T00:00:00.000Z',
        showMarksTitle: false,
        selectedMarksFields: [],
        totalMarks: 120,
        enableGrading: false,
        passMarks: null,
        showPercentageInResult: false,
        showGPAInResult: false,
        useGPASystem: false,
        instructions: 'Updated instructions',
        duration: 150,
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam already exists',
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam cannot be deleted because it has associated results',
    schema: {
      example: {
        statusCode: 409,
        message: 'Cannot delete exam because it has associated results',
        error: 'Conflict',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.examService.remove(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exam statistics' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam statistics',
    schema: {
      example: {
        exam: {
          _id: '507f1f77bcf86cd799439011',
          examName: 'Mid-Term Examination 2025',
          topicName: 'Algebra & Geometry',
          class: {
            _id: '507f1f77bcf86cd799439021',
            classname: 'Class 10'
          },
          subject: {
            _id: '507f1f77bcf86cd799439023',
            subjectName: 'Mathematics'
          },
          examCategory: {
            _id: '507f1f77bcf86cd799439024',
            categoryName: 'Quarterly Exams'
          },
          batches: [
            {
              _id: '507f1f77bcf86cd799439022',
              batchName: 'Morning Batch'
            }
          ],
          examDate: '2024-12-25T00:00:00.000Z',
          totalMarks: 100,
          enableGrading: true,
          passMarks: 40,
          isActive: true,
        },
        statistics: {
          totalStudents: 50,
          appearedStudents: 48,
          passCount: 42,
          failCount: 6,
          averageMarks: 72.5,
          highestMarks: 98,
          lowestMarks: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
  })
  async getExamStats(@Param('id') id: string) {
    return this.examService.getExamStats(id);
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
        examName: 'Mid-Term Examination 2025',
        isActive: false,
        class: {
          _id: '507f1f77bcf86cd799439021',
          classname: 'Class 10'
        },
        subject: {
          _id: '507f1f77bcf86cd799439023',
          subjectName: 'Mathematics'
        },
        examCategory: {
          _id: '507f1f77bcf86cd799439024',
          categoryName: 'Quarterly Exams'
        },
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam not found',
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

  @Get('batch/:batchId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get exams by batch' })
  @ApiParam({
    name: 'batchId',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439022',
  })
  @ApiQuery({
    name: 'upcomingOnly',
    required: false,
    type: Boolean,
    description: 'Get only upcoming exams',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter exams from date',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter exams to date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of exams for the batch',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            examName: 'Mid-Term Examination 2025',
            topicName: 'Algebra & Geometry',
            class: {
              _id: '507f1f77bcf86cd799439021',
              classname: 'Class 10'
            },
            subject: {
              _id: '507f1f77bcf86cd799439023',
              subjectName: 'Mathematics',
              subjectCode: 'MATH101'
            },
            examCategory: {
              _id: '507f1f77bcf86cd799439024',
              categoryName: 'Quarterly Exams'
            },
            examDate: '2024-12-25T00:00:00.000Z',
            totalMarks: 100,
            isActive: true,
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  async getExamsByBatch(
    @Param('batchId') batchId: string,
    @Query('upcomingOnly') upcomingOnly?: boolean,
    @Query('isActive') isActive?: boolean,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const query = {
      upcomingOnly: upcomingOnly === true,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      fromDate,
      toDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    return this.examService.getExamsByBatch(batchId, query);
  }

  @Get('class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get exams by class' })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: '507f1f77bcf86cd799439021',
  })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    type: String,
    description: 'Filter by subject ID',
  })
  @ApiQuery({
    name: 'upcomingOnly',
    required: false,
    type: Boolean,
    description: 'Get only upcoming exams',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of exams for the class',
  })
  async getExamsByClass(
    @Param('classId') classId: string,
    @Query('subjectId') subjectId?: string,
    @Query('upcomingOnly') upcomingOnly?: boolean,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const query = {
      subjectId,
      upcomingOnly: upcomingOnly === true,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    return this.examService.getExamsByClass(classId, query);
  }

  @Get('student/upcoming')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get upcoming exams for a student' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of upcoming exams to return',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of upcoming exams for the student',
    schema: {
      example: [
        {
          _id: '507f1f77bcf86cd799439011',
          examName: 'Mid-Term Examination 2025',
          topicName: 'Algebra & Geometry',
          class: {
            _id: '507f1f77bcf86cd799439021',
            classname: 'Class 10'
          },
          subject: {
            _id: '507f1f77bcf86cd799439023',
            subjectName: 'Mathematics'
          },
          examCategory: {
            _id: '507f1f77bcf86cd799439024',
            categoryName: 'Quarterly Exams'
          },
          batches: [
            {
              _id: '507f1f77bcf86cd799439022',
              batchName: 'Morning Batch'
            }
          ],
          examDate: '2024-12-25T00:00:00.000Z',
          totalMarks: 100,
          duration: 180,
        }
      ],
    },
  })
  async getUpcomingExamsForStudent(
    @Req() req: Request,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    
    // In a real application, you would get the student ID from the user object
    // or from a separate student profile. For now, using the user ID as student ID
    return this.examService.getUpcomingExamsForStudent(user._id, limit || 10);
  }

  @Get(':id/result-setup')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get exam details for result entry setup' })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam details with mark titles and grading info for result entry',
    schema: {
      example: {
        exam: {
          _id: '507f1f77bcf86cd799439011',
          examName: 'Mid-Term Examination 2025',
          topicName: 'Algebra & Geometry',
          class: {
            _id: '507f1f77bcf86cd799439021',
            classname: 'Class 10'
          },
          batches: [
            {
              _id: '507f1f77bcf86cd799439022',
              batchName: 'Morning Batch',
              sessionYear: '2024-2025'
            }
          ],
          subject: {
            _id: '507f1f77bcf86cd799439023',
            subjectName: 'Mathematics'
          },
          examDate: '2024-12-25T00:00:00.000Z',
          showMarksTitle: true,
          selectedMarksFields: ['mcq', 'cq', 'written'],
          totalMarks: 100,
          enableGrading: true,
          passMarks: 40,
          showPercentageInResult: true,
          showGPAInResult: false,
          useGPASystem: false,
        },
        studentCount: 45,
        resultEntryStatus: 'not_started',
        resultsEntered: 0,
      },
    },
  })
  async getExamResultSetup(@Param('id') id: string) {
    return this.examService.getExamResultSetup(id);
  }

  @Get('debug/user-info')
  @UseGuards(JwtAuthGuard)
  debugUserInfo(@Req() req: Request) {
    const user = req.user as any;
    return {
      message: 'Debug user information',
      user: user,
      userId: user?._id,
      userType: typeof user?._id,
      isObjectId: require('mongoose').Types.ObjectId.isValid(user?._id)
    };
  }
}