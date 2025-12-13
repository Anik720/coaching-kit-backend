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
  NotFoundException,
  UseGuards,
  UseFilters,
  Req, // Add this import
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BatchService } from './batch.service';
import { IBatchStats } from './interfaces/batch.interface';
import {
  BatchListResponseDto,
  BatchResponseDto,
  ClassResponse,
  GroupResponse,
  SubjectResponse,
  UserResponse,
} from './dto/batch-response.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { Batch } from './batch.schema';
import { BatchQueryDto } from './dto/batch-query.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Types } from 'mongoose';

@ApiTags('batches')
@ApiBearerAuth('JWT-auth')
@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Batch created successfully',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Batch already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Batch with this name already exists',
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
        message: ['batchName must be a string', 'className must be a string'],
        error: 'Bad Request',
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
        path: '/batches',
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
        path: '/batches',
      },
    },
  })
  async create(
    @Body() createBatchDto: CreateBatchDto,
    @Req() req: any, // Add request parameter to get user from JWT
  ): Promise<BatchResponseDto> {
    // Get user ID from JWT token (authenticated user)
    const userId = req.user._id;
    
    console.log('Creating batch with user ID:', userId);
    
    const batch = await this.batchService.create({
      ...createBatchDto,
      createdBy: userId, // Use the authenticated user's ID
    });
    return this.serializeBatch(batch);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all batches with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of batches',
    type: BatchListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/batches',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: ['super_admin', 'user_admin', 'staff'],
        userRole: null,
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/batches',
      },
    },
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'className', required: false, type: String })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'sessionYear', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'completed', 'upcoming'],
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'createdBy', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  async findAll(@Query() query: BatchQueryDto): Promise<BatchListResponseDto> {
    const result = await this.batchService.findAll(query);
    console.log('Batches found:', JSON.stringify(result.data));

    const data = result.data.map((batch) => this.serializeBatch(batch));
 console.log('Batches found data:', data);
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
  @ApiOperation({ summary: 'Get batch statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch statistics',
    schema: {
      example: {
        totalBatches: 15,
        activeBatches: 10,
        inactiveBatches: 3,
        completedBatches: 2,
        upcomingBatches: 5,
        averageStudentsPerBatch: 25,
        totalRevenue: 150000,
        batchByStatus: {
          active: 10,
          inactive: 3,
          completed: 2,
          upcoming: 5,
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
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: '2023-12-06T10:30:00.000Z',
        path: '/batches/stats',
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
        path: '/batches/stats',
      },
    },
  })
  async getStats(): Promise<IBatchStats> {
    return await this.batchService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a batch by ID' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch details',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Batch not found',
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
        path: '/batches/507f1f77bcf86cd799439011',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<BatchResponseDto> {
    const batch = await this.batchService.findOne(id);
    return this.serializeBatch(batch);
  }

  @Get(':id/availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Check batch availability for enrollment' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch availability status',
    schema: {
      example: {
        available: true,
        remainingSeats: 15,
        totalSeats: 50,
        enrollmentStatus: 'open',
        message: 'Batch is available for enrollment',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Batch not found',
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
        path: '/batches/507f1f77bcf86cd799439011/availability',
      },
    },
  })
  async checkAvailability(@Param('id') id: string) {
    return await this.batchService.checkBatchAvailability(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update a batch' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch updated successfully',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Batch not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Batch already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Batch with this name already exists',
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
        message: ['batchName must be a string', 'className must be a string'],
        error: 'Bad Request',
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
        path: '/batches/507f1f77bcf86cd799439011',
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
        path: '/batches/507f1f77bcf86cd799439011',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ): Promise<BatchResponseDto> {
    const batch = await this.batchService.update(id, updateBatchDto);
    return this.serializeBatch(batch);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Toggle batch active status' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch status toggled successfully',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Batch not found',
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
        path: '/batches/507f1f77bcf86cd799439011/toggle-status',
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
        path: '/batches/507f1f77bcf86cd799439011/toggle-status',
      },
    },
  })
  async toggleStatus(@Param('id') id: string): Promise<BatchResponseDto> {
    const batch = await this.batchService.toggleStatus(id);
    return this.serializeBatch(batch);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a batch' })
  @ApiParam({
    name: 'id',
    description: 'Batch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Batch deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Batch not found',
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
        path: '/batches/507f1f77bcf86cd799439011',
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
        path: '/batches/507f1f77bcf86cd799439011',
      },
    },
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.batchService.remove(id);
  }

  @Get('date-range/:startDate/:endDate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get batches within a date range' })
  @ApiParam({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiParam({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batches within date range',
    type: [BatchResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid date format. Use YYYY-MM-DD',
        error: 'Bad Request',
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
        path: '/batches/date-range/2023-01-01/2023-12-31',
      },
    },
  })
  async getByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<BatchResponseDto[]> {
    // Validate date format
    const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!startDateRegex.test(startDate) || !endDateRegex.test(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const batches = await this.batchService.getBatchesByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
    return batches.map((batch) => this.serializeBatch(batch));
  }

  /**
   * Serialize Mongoose document to BatchResponseDto
   */
private serializeBatch(batch: any): BatchResponseDto {
  if (!batch) {
    throw new NotFoundException('Batch not found');
  }

  console.log('Serializing batch:', batch);

  // Convert with virtuals but clean up unwanted 'id' virtuals
  const plainBatch = batch.toObject
    ? batch.toObject({
        virtuals: true,
        transform: (doc, ret) => {
          // Remove virtual 'id' from all populated documents
          ['createdBy', 'className', 'group', 'subject'].forEach(field => {
            if (ret[field] && ret[field].id) {
              delete ret[field].id;
            }
          });
          return ret;
        },
      })
    : batch;

  const today = new Date();
  const start = new Date(plainBatch.batchStartingDate);
  const end = new Date(plainBatch.batchClosingDate);

  const totalFee = (plainBatch.admissionFee || 0) + (plainBatch.tuitionFee || 0) + (plainBatch.courseFee || 0);
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isActiveSession = today >= start && today <= end && plainBatch.isActive;

  // Helper to safely extract populated ref
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

  const className = safeRef(plainBatch.className, '_id', 'classname');
  const group = safeRef(plainBatch.group, '_id', 'groupName');
  const subject = safeRef(plainBatch.subject, '_id', 'subjectName');

  let createdBy: string | UserResponse = '';

  if (plainBatch.createdBy) {
    if (typeof plainBatch.createdBy === 'object' && plainBatch.createdBy._id) {
      const user = plainBatch.createdBy;
      createdBy = {
        _id: user._id.toString(), // Always use ._id — it's reliable
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      };
    } else {
      // Fallback: just the raw ObjectId as string
      createdBy = plainBatch.createdBy.toString();
    }
  }
  // If createdBy is null → remains '' (user deleted)

  return {
    _id: plainBatch._id.toString(),
    batchName: plainBatch.batchName,
    className,
    group,
    subject,
    sessionYear: plainBatch.sessionYear || '',
    batchStartingDate: plainBatch.batchStartingDate,
    batchClosingDate: plainBatch.batchClosingDate,
    admissionFee: plainBatch.admissionFee || 0,
    tuitionFee: plainBatch.tuitionFee || 0,
    courseFee: plainBatch.courseFee || 0,
    status: plainBatch.status || 'active',
    isActive: plainBatch.isActive ?? true,
    description: plainBatch.description || '',
    maxStudents: plainBatch.maxStudents || 50,
    createdBy,
    createdAt: plainBatch.createdAt,
    updatedAt: plainBatch.updatedAt,
    totalFee,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    isActiveSession,
  };
}
}