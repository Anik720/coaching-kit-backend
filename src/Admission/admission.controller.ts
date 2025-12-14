import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { AdmissionService } from './admission.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../shared/filters/auth-exception.filter';
import type { Request } from 'express';

@ApiTags('admissions')
@ApiBearerAuth('JWT-auth')
@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create new admission (can be incomplete)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Admission created successfully',
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['registrationId is required', 'Invalid mobile number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Registration ID already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Registration ID already exists',
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
        path: '/admissions',
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
        path: '/admissions',
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createAdmissionDto: CreateAdmissionDto,
    @Req() req: Request,
    @UploadedFile() photo?: any,
  ): Promise<AdmissionResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }

    // Handle photo upload if provided
    if (photo) {
      // createAdmissionDto.photoUrl = await this.uploadPhoto(photo);
      // createAdmissionDto.photoPath = photo.path;
    }

    console.log('Received DTO:', createAdmissionDto);
    
    const admission = await this.admissionService.create(createAdmissionDto, user._id);
    return this.mapToResponseDto(admission);
  }

  @Put(':registrationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update admission by registration ID' })
  @ApiParam({
    name: 'registrationId',
    description: 'Registration ID',
    example: 'REG001',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Admission updated successfully',
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admission not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Admission with registration ID REG001 not found',
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
        message: 'Invalid date format',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Registration ID already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Registration ID already exists',
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
        path: '/admissions/REG001',
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
        path: '/admissions/REG001',
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('registrationId') registrationId: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
    @Req() req: Request,
    @UploadedFile() photo?: any,
  ): Promise<AdmissionResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }

    // Handle photo upload if provided
    if (photo) {
      // updateAdmissionDto.photoUrl = await this.uploadPhoto(photo);
      // updateAdmissionDto.photoPath = photo.path;
    }

    const admission = await this.admissionService.update(
      registrationId, 
      updateAdmissionDto,
      user._id
    );
    return this.mapToResponseDto(admission);
  }

  @Get(':registrationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get admission by registration ID' })
  @ApiParam({
    name: 'registrationId',
    description: 'Registration ID',
    example: 'REG001',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Admission details',
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admission not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Admission with registration ID REG001 not found',
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
        path: '/admissions/REG001',
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
        path: '/admissions/REG001',
      },
    },
  })
  async findOne(@Param('registrationId') registrationId: string): Promise<AdmissionResponseDto> {
    const admission = await this.admissionService.findByRegistrationId(registrationId);
    return this.mapToResponseDto(admission);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all admissions with filters and pagination' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'completed', 'approved', 'rejected', 'incomplete', 'cancelled'],
    description: 'Filter by admission status',
  })
  @ApiQuery({
    name: 'isCompleted',
    required: false,
    type: Boolean,
    description: 'Filter by completion status',
  })
  @ApiQuery({
    name: 'admissionType',
    required: false,
    type: String,
    description: 'Filter by admission type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by registration ID, name, institute, or mobile number',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator user ID',
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
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of admissions',
    schema: {
      example: {
        admissions: [
          {
            registrationId: 'REG001',
            name: 'John Doe',
            instituteName: 'ABC School',
            studentGender: 'male',
            religion: 'islam',
            guardianMobileNumber: '01712345678',
            admissionType: 'monthly',
            status: 'pending',
            totalFee: 5000,
            paidAmount: 2000,
            dueAmount: 3000,
            admissionDate: '2023-12-06T10:30:00.000Z',
            createdAt: '2023-12-06T10:30:00.000Z',
            createdBy: {
              _id: '507f1f77bcf86cd799439022',
              email: 'admin@example.com',
              username: 'admin',
              role: 'user_admin'
            }
          }
        ],
        total: 1,
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
        path: '/admissions',
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
        path: '/admissions',
      },
    },
  })
  async findAll(
    @Query('status') status?: string,
    @Query('isCompleted') isCompleted?: string,
    @Query('admissionType') admissionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('createdBy') createdBy?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    admissions: AdmissionResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: any = {};
    
    if (status) filters.status = status;
    if (isCompleted !== undefined) filters.isCompleted = isCompleted === 'true';
    if (admissionType) filters.admissionType = admissionType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (search) filters.search = search;
    if (createdBy) filters.createdBy = createdBy;

    const result = await this.admissionService.findAll(filters, { page, limit });
    
    return {
      admissions: result.admissions.map(admission => this.mapToResponseDto(admission)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  @Delete(':registrationId')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete admission by registration ID' })
  @ApiParam({
    name: 'registrationId',
    description: 'Registration ID',
    example: 'REG001',
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Admission deleted successfully' 
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admission not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Admission with registration ID REG001 not found',
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
        path: '/admissions/REG001',
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
        path: '/admissions/REG001',
      },
    },
  })
  async delete(@Param('registrationId') registrationId: string): Promise<{ message: string }> {
    await this.admissionService.delete(registrationId);
    return { message: 'Admission deleted successfully' };
  }

  @Get('statistics/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get admission statistics' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Admission statistics',
    schema: {
      example: {
        total: 100,
        pending: 20,
        completed: 60,
        approved: 15,
        rejected: 5,
        todayAdmissions: 10,
        thisMonthAdmissions: 45,
        totalRevenue: 500000,
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
        path: '/admissions/statistics/summary',
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
        path: '/admissions/statistics/summary',
      },
    },
  })
  async getStatistics(@Req() req: Request): Promise<any> {
    const user = req.user as any;
    const userId = user?._id;
    return await this.admissionService.getStatistics(userId);
  }

  @Get('search/quick')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Quick search admissions' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (at least 2 characters)',
    example: 'john',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Search results',
    type: [AdmissionResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Search query must be at least 2 characters long',
    schema: {
      example: {
        statusCode: 400,
        message: 'Search query must be at least 2 characters long',
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
        path: '/admissions/search/quick',
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
        path: '/admissions/search/quick',
      },
    },
  })
  async quickSearch(
    @Query('q') query: string,
  ): Promise<AdmissionResponseDto[]> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const result = await this.admissionService.findAll({ search: query }, { limit: 20 });
    return result.admissions.map(admission => this.mapToResponseDto(admission));
  }

  @Get('my-admissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get admissions created by the current user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'completed', 'approved', 'rejected', 'incomplete', 'cancelled'],
    description: 'Filter by admission status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by registration ID, name, or institute',
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
  async getMyAdmissions(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    admissions: AdmissionResponseDto[];
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
    if (search) filters.search = search;

    const result = await this.admissionService.getMyAdmissions(user._id, filters, { page, limit });
    
    return {
      admissions: result.admissions.map(admission => this.mapToResponseDto(admission)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  // Helper method to map admission to response DTO
private mapToResponseDto(admission: any): AdmissionResponseDto {
  return {
    _id: admission._id.toString(),
    registrationId: admission.registrationId,
    name: admission.name,
    instituteName: admission.instituteName,
    studentGender: admission.studentGender,
    religion: admission.religion,
    guardianMobileNumber: admission.guardianMobileNumber,
    admissionDate: admission.admissionDate,
    nameNative: admission.nameNative,
    studentDateOfBirth: admission.studentDateOfBirth,
    age: admission.age,
    presentAddress: admission.presentAddress,
    permanentAddress: admission.permanentAddress,
    whatsappMobile: admission.whatsappMobile,
    studentMobileNumber: admission.studentMobileNumber,
    fathersName: admission.fathersName,
    mothersName: admission.mothersName,
    motherMobileNumber: admission.motherMobileNumber,
    admissionType: admission.admissionType,
    courseFee: admission.courseFee,
    admissionFee: admission.admissionFee,
    tuitionFee: admission.tuitionFee,
    referBy: admission.referBy,
    batches: admission.batches,
    status: admission.status,
    isCompleted: admission.isCompleted,
    totalFee: admission.totalFee,
    paidAmount: admission.paidAmount,
    dueAmount: admission.dueAmount,
    photoUrl: admission.photoUrl,
    remarks: admission.remarks,
    completedAt: admission.completedAt,
    approvedAt: admission.approvedAt,
    // Return undefined instead of null
    createdBy: admission.createdBy ? {
      _id: admission.createdBy._id.toString(),
      email: admission.createdBy.email,
      username: admission.createdBy.username,
      role: admission.createdBy.role,
    } : undefined,  // <-- Change null to undefined
    updatedBy: admission.updatedBy ? {
      _id: admission.updatedBy._id.toString(),
      email: admission.updatedBy.email,
      username: admission.updatedBy.username,
      role: admission.updatedBy.role,
    } : undefined,  // <-- Change null to undefined
    createdAt: admission.createdAt,
    updatedAt: admission.updatedAt,
  };
}
}