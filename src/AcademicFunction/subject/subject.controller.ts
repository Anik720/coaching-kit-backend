import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
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
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import type { Request } from 'express';

@ApiTags('academic/subject')
@ApiBearerAuth('JWT-auth')
@Controller('academic/subject')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiBody({ type: CreateSubjectDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        subjectName: 'Mathematics',
        description: 'Mathematics subject',
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
        message: ['subjectName must be a string', 'subjectName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Subject with this name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Subject with this name already exists',
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
        path: '/academic/subject',
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
        path: '/academic/subject',
      },
    },
  })
  create(
    @Body() dto: CreateSubjectDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.subjectService.create(dto, user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all subjects with pagination' })
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
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by subject name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of subjects',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            subjectName: 'Mathematics',
            description: 'Mathematics subject',
            isActive: true,
            createdBy: {
              _id: '507f1f77bcf86cd799439022',
              email: 'admin@example.com',
              username: 'admin',
              role: 'user_admin'
            },
            updatedBy: null,
            createdAt: '2023-12-06T10:30:00.000Z',
            updatedAt: '2023-12-06T10:30:00.000Z',
          },
          {
            _id: '507f1f77bcf86cd799439012',
            subjectName: 'Physics',
            description: 'Physics subject',
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
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        },
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
        path: '/academic/subject',
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
        requiredRoles: ['super_admin', 'user_admin', 'staff'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/subject',
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const query = { page, limit, search, isActive };
    return this.subjectService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject details',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        subjectName: 'Mathematics',
        description: 'Mathematics subject',
        isActive: true,
        createdBy: {
          _id: '507f1f77bcf86cd799439022',
          email: 'admin@example.com',
          username: 'admin',
          role: 'user_admin'
        },
        updatedBy: null,
        createdAt: '2023-12-06T10:30:00.000Z',
        updatedAt: '2023-12-06T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Subject not found',
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
        path: '/academic/subject/507f1f77bcf86cd799439011',
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
        requiredRoles: ['super_admin', 'user_admin', 'staff'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/academic/subject/507f1f77bcf86cd799439011',
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        subjectName: 'Mathematics Updated',
        description: 'Updated mathematics subject',
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
    description: 'Subject not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Subject not found',
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
        message: ['subjectName must be a string', 'subjectName must be at least 2 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Subject with this name already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Subject with this name already exists',
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
        path: '/academic/subject/507f1f77bcf86cd799439011',
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
        path: '/academic/subject/507f1f77bcf86cd799439011',
      },
    },
  })
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateSubjectDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.subjectService.update(id, dto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Subject deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Subject not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Subject cannot be deleted because it has associated batches',
    schema: {
      example: {
        statusCode: 409,
        message: 'Cannot delete subject because it has associated batches',
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
        path: '/academic/subject/507f1f77bcf86cd799439011',
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
        path: '/academic/subject/507f1f77bcf86cd799439011',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }

  @Get(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get subject status and statistics' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject status and statistics',
    schema: {
      example: {
        subject: {
          _id: '507f1f77bcf86cd799439011',
          subjectName: 'Mathematics',
          isActive: true,
          createdBy: {
            _id: '507f1f77bcf86cd799439022',
            email: 'admin@example.com',
            username: 'admin',
            role: 'user_admin'
          },
          updatedBy: null,
        },
        totalBatches: 5,
        activeBatches: 3,
        totalStudents: 150,
        averageStudentsPerBatch: 30,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Subject not found',
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
        path: '/academic/subject/507f1f77bcf86cd799439011/status',
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
        path: '/academic/subject/507f1f77bcf86cd799439011/status',
      },
    },
  })
  async getSubjectStatus(@Param('id') id: string) {
    return this.subjectService.getSubjectStatus(id);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle subject active status' })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject active status toggled successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        subjectName: 'Mathematics',
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
        message: 'Subject status updated successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subject not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Subject not found',
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
        path: '/academic/subject/507f1f77bcf86cd799439011/toggle-active',
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
        path: '/academic/subject/507f1f77bcf86cd799439011/toggle-active',
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
    return this.subjectService.toggleActive(id, user._id);
  }

  @Get('my-subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get subjects created by the current user' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by subject name',
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
  async getMySubjects(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    
    const query = {
      search,
      isActive,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    
    return this.subjectService.findByCreator(user._id, query);
  }
}