import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, UsePipes, ValidationPipe, HttpCode, HttpStatus,
  UseGuards, UseFilters
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../shared/filters/auth-exception.filter';
import { StudentService } from 'src/student/student.service';
import { CreateStudentDto } from 'src/student/dto/create-student.dto';
import { StudentResponseDto } from 'src/student/dto/student-response.dto';
import { UpdateStudentDto } from 'src/student/dto/update-student.dto';

@ApiTags('students')
@ApiBearerAuth('JWT-auth')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Create a new student' })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student created successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['nameEnglish must be a string', 'registrationId is required'],
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
        path: '/students',
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
        path: '/students',
      },
    },
  })
  async create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all students with filters and pagination' })
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
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, registration ID, or father name',
  })
  @ApiQuery({
    name: 'class',
    required: false,
    type: String,
    description: 'Filter by class ID',
  })
  @ApiQuery({
    name: 'batch',
    required: false,
    type: String,
    description: 'Filter by batch ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'completed', 'suspended'],
    description: 'Filter by student status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    enum: ['male', 'female', 'other'],
    description: 'Filter by gender',
  })
  @ApiQuery({
    name: 'admissionType',
    required: false,
    enum: ['regular', 'monthly', 'special'],
    description: 'Filter by admission type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of students',
    type: [StudentResponseDto],
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
        path: '/students',
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
        path: '/students',
      },
    },
  })
  async findAll(@Query() query: any): Promise<StudentResponseDto[]> {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student details',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with ID 507f1f77bcf86cd799439011 not found',
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
        path: '/students/507f1f77bcf86cd799439011',
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
        path: '/students/507f1f77bcf86cd799439011',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
    return this.studentService.findOne(id);
  }

  @Get('registration/:registrationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a student by registration ID' })
  @ApiParam({
    name: 'registrationId',
    description: 'Student registration ID',
    example: 'REG20231206001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student details',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with registration ID REG20231206001 not found',
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
        path: '/students/registration/REG20231206001',
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
        path: '/students/registration/REG20231206001',
      },
    },
  })
  async findByRegistrationId(
    @Param('registrationId') registrationId: string
  ): Promise<StudentResponseDto> {
    return this.studentService.findByRegistrationId(registrationId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update a student' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student updated successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with ID 507f1f77bcf86cd799439011 not found',
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
        message: ['nameEnglish must be a string', 'Invalid date format'],
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
        path: '/students/507f1f77bcf86cd799439011',
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
        path: '/students/507f1f77bcf86cd799439011',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto
  ): Promise<StudentResponseDto> {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Student deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with ID 507f1f77bcf86cd799439011 not found',
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
        path: '/students/507f1f77bcf86cd799439011',
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
        path: '/students/507f1f77bcf86cd799439011',
      },
    },
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Update student status' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'active' },
        isActive: { type: 'boolean', example: true },
      },
      required: ['status', 'isActive'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student status updated successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with ID 507f1f77bcf86cd799439011 not found',
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
        path: '/students/507f1f77bcf86cd799439011/status',
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
        path: '/students/507f1f77bcf86cd799439011/status',
      },
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; isActive: boolean }
  ): Promise<StudentResponseDto> {
    return this.studentService.updateStatus(id, body.status, body.isActive);
  }

  @Post(':id/payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Make a payment for student' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000 },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment successful',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Student with ID 507f1f77bcf86cd799439011 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment amount exceeds total amount due',
    schema: {
      example: {
        statusCode: 400,
        message: 'Payment amount exceeds total amount due',
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
        path: '/students/507f1f77bcf86cd799439011/payment',
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
        path: '/students/507f1f77bcf86cd799439011/payment',
      },
    },
  })
  async makePayment(
    @Param('id') id: string,
    @Body() body: { amount: number }
  ): Promise<StudentResponseDto> {
    return this.studentService.makePayment(id, body.amount);
  }

  @Get('statistics/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @ApiOperation({ summary: 'Get student statistics overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student statistics',
    schema: {
      example: {
        totalStudents: 150,
        activeStudents: 120,
        inactiveStudents: 30,
        totalDueAmount: 250000,
        classDistribution: [
          { className: 'Class 10', count: 50 },
          { className: 'Class 9', count: 40 },
          { className: 'Class 8', count: 60 },
        ],
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
        path: '/students/statistics/overview',
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
        path: '/students/statistics/overview',
      },
    },
  })
  async getStatistics(): Promise<any> {
    return this.studentService.getStatistics();
  }
}