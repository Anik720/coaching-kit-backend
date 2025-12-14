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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { HomeworkQueryDto } from './dto/homework-query.dto';
import {
  HomeworkResponseDto,
  HomeworkListResponseDto,
} from './dto/homework-response.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthExceptionFilter } from 'src/shared/filters/auth-exception.filter';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';


@ApiTags('homework')
@ApiBearerAuth('JWT-auth')
@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new homework assignment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Homework created successfully',
    type: HomeworkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Homework already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async create(
    @Body() createHomeworkDto: CreateHomeworkDto,
    @Req() req: any,
  ): Promise<HomeworkResponseDto> {
    const userId = req.user._id;
    const homework = await this.homeworkService.create(createHomeworkDto, userId);
    return this.serializeHomework(homework);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all homework assignments with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of homework assignments',
    type: HomeworkListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async findAll(@Query() query: HomeworkQueryDto): Promise<HomeworkListResponseDto> {
    const result = await this.homeworkService.findAll(query);
    const data = result.data.map((homework) => this.serializeHomework(homework));
    
    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    } 
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a homework assignment by ID' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Homework details',
    type: HomeworkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Homework not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id') id: string): Promise<HomeworkResponseDto> {
    const homework = await this.homeworkService.findOne(id);
    return this.serializeHomework(homework);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a homework assignment' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Homework updated successfully',
    type: HomeworkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Homework not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Homework already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
    @Req() req: any,
  ): Promise<HomeworkResponseDto> {
    const userId = req.user._id;
    const homework = await this.homeworkService.update(id, updateHomeworkDto, userId);
    return this.serializeHomework(homework);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a homework assignment' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Homework deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Homework not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.homeworkService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Toggle homework active status' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Homework status toggled successfully',
    type: HomeworkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Homework not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<HomeworkResponseDto> {
    const userId = req.user._id;
    const homework = await this.homeworkService.toggleActive(id, userId);
    return this.serializeHomework(homework);
  }

  @Get('stats/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get homework statistics overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Homework statistics',
    schema: {
      example: {
        totalHomework: 50,
        activeHomework: 30,
        upcomingHomework: 15,
        completedHomework: 5,
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
  async getStats() {
    return await this.homeworkService.getHomeworkStats();
  }

  @Get('date-range/:startDate/:endDate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get homework within a date range' })
  @ApiParam({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2023-12-01',
  })
  @ApiParam({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Homework within date range',
    type: [HomeworkResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<HomeworkResponseDto[]> {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    const homeworks = await this.homeworkService.getHomeworkByDateRange(start, end);
    return homeworks.map((homework) => this.serializeHomework(homework));
  }

  /**
   * Serialize Mongoose document to HomeworkResponseDto
   */
  private serializeHomework(homework: any): HomeworkResponseDto {
    const plainHomework = homework.toObject
      ? homework.toObject({ virtuals: true })
      : homework;

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

    const classResponse = safeRef(plainHomework.class, '_id', 'classname');
    const subjectResponse = safeRef(plainHomework.subject, '_id', 'subjectName');
    
    // Handle batches array
    let batchesResponse: any[] = [];
    if (Array.isArray(plainHomework.batches)) {
      batchesResponse = plainHomework.batches.map(batch => {
        if (batch && typeof batch === 'object' && batch._id) {
          return {
            _id: batch._id.toString(),
            batchName: batch.batchName || '',
          };
        }
        return batch.toString();
      });
    }

    // Handle createdBy
    let createdByResponse: any = '';
    if (plainHomework.createdBy) {
      if (typeof plainHomework.createdBy === 'object' && plainHomework.createdBy._id) {
        const user = plainHomework.createdBy;
        createdByResponse = {
          _id: user._id.toString(),
          username: user.username || '',
          email: user.email || '',
        };
      } else {
        createdByResponse = plainHomework.createdBy.toString();
      }
    }

    // Handle updatedBy
    let updatedByResponse: any = undefined;
    if (plainHomework.updatedBy) {
      if (typeof plainHomework.updatedBy === 'object' && plainHomework.updatedBy._id) {
        const user = plainHomework.updatedBy;
        updatedByResponse = {
          _id: user._id.toString(),
          username: user.username || '',
          email: user.email || '',
        };
      } else {
        updatedByResponse = plainHomework.updatedBy.toString();
      }
    }

    return {
      _id: plainHomework._id.toString(),
      homeworkName: plainHomework.homeworkName,
      description: plainHomework.description,
      class: classResponse,
      batches: batchesResponse,
      subject: subjectResponse,
      homeworkDate: plainHomework.homeworkDate,
      createdBy: createdByResponse,
      updatedBy: updatedByResponse,
      isActive: plainHomework.isActive ?? true,
      createdAt: plainHomework.createdAt,
      updatedAt: plainHomework.updatedAt,
    };
  }
}