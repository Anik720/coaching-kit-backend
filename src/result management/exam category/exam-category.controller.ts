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
import { ExamCategoryService } from './exam-category.service';
import { CreateExamCategoryDto } from './dto/create-exam-category.dto';
import { UpdateExamCategoryDto } from './dto/update-exam-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import type { Request } from 'express';

@ApiTags('academic/exam-category')
@ApiBearerAuth('JWT-auth')
@Controller('academic/exam-category')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class ExamCategoryController {
  constructor(private readonly examCategoryService: ExamCategoryService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Create a new exam category' })
  @ApiBody({ type: CreateExamCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exam category created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        categoryName: 'Quarterly Exams',
        description: 'Quarterly examination category',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['categoryName must be a string', 'categoryName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam category already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Exam category with this name already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category',
      },
    },
  })
  create(
    @Body() dto: CreateExamCategoryDto,
    @Req() req: Request
  ) {
    console.log('=== Controller Debug ===');
    console.log('Request user object:', req.user);
    console.log('User ID from request:', (req.user as any)?._id);
    
    const user = req.user as any;
    
    if (!user || !user._id) {
      console.error('ERROR: No user or user._id found in request');
      throw new Error('User authentication failed - no user ID found');
    }
    
    console.log('Passing userId to service:', user._id);
    console.log('=== End Controller Debug ===');
    
    return this.examCategoryService.create(dto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all exam categories with filtering and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by categoryName',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
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
    example: 'createdAt',
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
    description: 'List of exam categories',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            categoryName: 'Quarterly Exams',
            description: 'Quarterly examination category',
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439022',
              email: 'admin@example.com',
              username: 'admin',
              role: 'user_admin'
            },
            updatedBy: {
              _id: '507f1f77bcf86cd799439022',
              email: 'admin@example.com',
              username: 'admin',
              role: 'user_admin'
            },
            createdAt: '2023-12-06T10:30:00.000Z',
            updatedAt: '2023-12-06T10:30:00.000Z',
          },
          {
            _id: '507f1f77bcf86cd799439012',
            categoryName: 'Final Exams',
            description: 'Final examination category',
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439023',
              email: 'teacher@example.com',
              username: 'teacher',
              role: 'staff'
            },
            updatedBy: null,
            createdAt: '2023-12-06T10:30:00.000Z',
            updatedAt: '2023-12-06T10:30:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin', 'staff', 'student', 'teacher'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category',
      },
    },
  })
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const query = {
      search,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };
    return this.examCategoryService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get an exam category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Exam Category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam category details',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        categoryName: 'Quarterly Exams',
        description: 'Quarterly examination category',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam category not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin', 'staff', 'student', 'teacher'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.examCategoryService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update an exam category' })
  @ApiParam({
    name: 'id',
    description: 'Exam Category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateExamCategoryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam category updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        categoryName: 'Quarterly Exams Updated',
        description: 'Updated quarterly examination category',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439023',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'staff'
        },
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T11:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam category not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['categoryName must be a string', 'categoryName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam category already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Exam category with this name already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateExamCategoryDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.examCategoryService.update(id, dto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exam category' })
  @ApiParam({
    name: 'id',
    description: 'Exam Category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Exam category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam category not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Exam category cannot be deleted because it has associated exams',
    schema: {
      example: {
        statusCode: 409,
        message: 'Cannot delete exam category because it has associated exams',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin'],
        userRole: 'user_admin',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.examCategoryService.remove(id);
  }

  @Get(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get exam category status and statistics' })
  @ApiParam({
    name: 'id',
    description: 'Exam Category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam category status and statistics',
    schema: {
      example: {
        category: {
          _id: '507f1f77bcf86cd799439011',
          categoryName: 'Quarterly Exams',
          isActive: true,
          createdBy: {
            _id: '507f1f77bcf86cd799439022',
            email: 'admin@example.com',
            username: 'admin',
            role: 'user_admin'
          },
          updatedBy: {
            _id: '507f1f77bcf86cd799439022',
            email: 'admin@example.com',
            username: 'admin',
            role: 'user_admin'
          },
        },
        totalExams: 5,
        activeExams: 3,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam category not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011/status',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011/status',
      },
    },
  })
  async getCategoryStatus(@Param('id') id: string) {
    return this.examCategoryService.getCategoryStatus(id);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle exam category active status' })
  @ApiParam({
    name: 'id',
    description: 'Exam Category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam category active status toggled successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        categoryName: 'Quarterly Exams',
        isActive: false,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: {
          _id: '507f1f77bcf86cd799439023',
          email: 'teacher@example.com',
          username: 'teacher',
          role: 'staff'
        },
        message: 'Exam category status updated successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Exam category not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Exam category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011/toggle-active',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin'],
        userRole: 'staff',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/exam-category/507f1f77bcf86cd799439011/toggle-active',
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
    return this.examCategoryService.toggleActive(id, user._id);
  }

  // Add a debug endpoint to check user info
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