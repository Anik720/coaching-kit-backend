import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpStatus,
  HttpCode,
  UseFilters,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/interfaces/user.interface';
import { AuthExceptionFilter } from '../../shared/filters/auth-exception.filter';
import type { Request } from 'express';

import { CombineResultService } from './combine-result.service';
import { CreateCombineResultDto, SearchCombineResultDto } from './dto/create-combine-result.dto';
import { UpdateCombineResultDto } from './dto/update-combine-result.dto';
import { CombineResultResponseDto, CombineResultStudentResponseDto } from './dto/combine-result-response.dto';

@ApiTags('results/combine')
@ApiBearerAuth('JWT-auth')
@Controller('results/combine')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class CombineResultController {
  constructor(private readonly combineResultService: CombineResultService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new combine result' })
  @ApiBody({ type: CreateCombineResultDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Combine result created successfully',
    type: CombineResultResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Combine result with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Class, batch, exam, or category not found',
  })
  async create(
    @Body() createCombineResultDto: CreateCombineResultDto,
    @Req() req: Request,
  ): Promise<CombineResultResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.combineResultService.create(createCombineResultDto, user._id);
  }

  @Post('search-exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Search exams for combine result creation' })
  @ApiBody({ type: SearchCombineResultDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exams retrieved successfully',
    schema: {
      example: [
        {
          _id: '67f1f77bcf86cd799439021',
          examName: 'Class Test -29',
          class: { _id: '67f1f77bcf86cd799439011', classname: 'HSC 2027' },
          batches: [{ _id: '67f1f77bcf86cd799439012', batchName: 'SUN-3PM' }],
          category: { _id: '67f1f77bcf86cd799439101', categoryName: 'Class Test' },
          totalMarks: 30,
          mcqMarks: 0,
          cqMarks: 0,
          writtenMarks: 30,
          examDate: '2024-01-15T00:00:00.000Z',
          isPublished: true,
          isActive: true,
        },
      ],
    },
  })
  async searchExams(
    @Body() searchDto: SearchCombineResultDto,
  ): Promise<any[]> {
    return this.combineResultService.searchExamsForCombine(searchDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all combine results with pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by combine result name',
  })
  @ApiQuery({
    name: 'class',
    required: false,
    type: String,
    description: 'Filter by class ID',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: Boolean,
    description: 'Filter by published status',
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
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
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
    description: 'Combine results retrieved successfully',
    schema: {
      example: {
        data: [
          {
            _id: '67f1f77bcf86cd799439031',
            name: 'HSC 2027 Combined Result',
            class: { _id: '67f1f77bcf86cd799439011', classname: 'HSC 2027' },
            batches: [
              { _id: '67f1f77bcf86cd799439012', batchName: 'SAT-2PM', sessionYear: '2024-2025' },
            ],
            exams: [
              { _id: '67f1f77bcf86cd799439021', examName: 'Class Test -29', totalMarks: 30 },
            ],
            category: { _id: '67f1f77bcf86cd799439101', categoryName: 'Class Test' },
            totalMarks: 60,
            isActive: true,
            isPublished: true,
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  async findAll(
    @Query('search') search?: string,
    @Query('class') classId?: string,
    @Query('category') category?: string,
    @Query('isPublished') isPublished?: boolean,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const query = {
      search,
      class: classId,
      category,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };
    return this.combineResultService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get combine result by ID' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combine result retrieved successfully',
    type: CombineResultResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Combine result not found',
  })
  async findOne(@Param('id') id: string): Promise<CombineResultResponseDto> {
    return this.combineResultService.findOne(id);
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get student results for a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by student name or ID',
  })
  @ApiQuery({
    name: 'batch',
    required: false,
    type: String,
    description: 'Filter by batch ID',
  })
  @ApiQuery({
    name: 'isPassed',
    required: false,
    type: Boolean,
    description: 'Filter by pass status',
  })
  @ApiQuery({
    name: 'isAbsent',
    required: false,
    type: Boolean,
    description: 'Filter by absent status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 100,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student results retrieved successfully',
    schema: {
      example: {
        data: [
          {
            _id: '67f1f77bcf86cd799439051',
            combineResultId: '67f1f77bcf86cd799439031',
            student: {
              _id: '67f1f77bcf86cd799439061',
              registrationId: 'STU001',
              nameEnglish: 'Tasfa Haque',
            },
            batch: { _id: '67f1f77bcf86cd799439012', batchName: 'SAT-2PM' },
            examMarks: {
              '67f1f77bcf86cd799439021': { obtainedMarks: 27, totalMarks: 30, isAbsent: false },
            },
            totalMarks: 60,
            obtainedMarks: 52,
            percentage: 86.67,
            grade: 'A',
            gpa: 4.0,
            position: 1,
            isPassed: true,
            isAbsent: false,
            resultClass: 'first_class',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      },
    },
  })
  async getStudentResults(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('batch') batch?: string,
    @Query('isPassed') isPassed?: boolean,
    @Query('isAbsent') isAbsent?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const query = {
      search,
      batch,
      isPassed: isPassed !== undefined ? Boolean(isPassed) : undefined,
      isAbsent: isAbsent !== undefined ? Boolean(isAbsent) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
    };
    return this.combineResultService.getStudentResults(id, query);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiBody({ type: UpdateCombineResultDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combine result updated successfully',
    type: CombineResultResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Combine result not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Combine result with this name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCombineResultDto,
    @Req() req: Request,
  ): Promise<CombineResultResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.combineResultService.update(id, updateDto, user._id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Combine result deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Combine result not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.combineResultService.remove(id);
  }

  @Put(':id/toggle-publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Toggle publish status of a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Publish status toggled successfully',
    type: CombineResultResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Combine result not found',
  })
  async togglePublish(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CombineResultResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.combineResultService.togglePublish(id, user._id);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Toggle active status of a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active status toggled successfully',
    type: CombineResultResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Combine result not found',
  })
  async toggleActive(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CombineResultResponseDto> {
    const user = req.user as any;
    if (!user || !user._id) {
      throw new Error('User authentication failed - no user ID found');
    }
    return this.combineResultService.toggleActive(id, user._id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get statistics for a combine result' })
  @ApiParam({
    name: 'id',
    description: 'Combine result ID',
    example: '67f1f77bcf86cd799439031',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        combineResult: {
          _id: '67f1f77bcf86cd799439031',
          name: 'HSC 2027 Combined Result',
          class: { _id: '67f1f77bcf86cd799439011', classname: 'HSC 2027' },
          batches: [{ _id: '67f1f77bcf86cd799439012', batchName: 'SAT-2PM' }],
          category: { _id: '67f1f77bcf86cd799439101', categoryName: 'Class Test' },
          totalMarks: 60,
          totalStudents: 50,
          statistics: {
            totalStudents: 50,
            presentStudents: 48,
            passedStudents: 45,
            failedStudents: 3,
            absentStudents: 2,
            averagePercentage: 68.5,
            highestMarks: 58,
            lowestMarks: 25,
            passPercentage: 90,
          },
          topPerformers: [
            {
              position: 1,
              studentId: '67f1f77bcf86cd799439061',
              registrationId: 'STU001',
              name: 'Tasfa Haque',
              batch: 'SAT-2PM',
              marks: 58,
              percentage: 96.67,
              grade: 'A+',
              gpa: 5.0,
              isPassed: true,
            },
          ],
          batchWiseStats: {
            '67f1f77bcf86cd799439012': {
              batchName: 'SAT-2PM',
              totalStudents: 50,
              presentStudents: 48,
              passedStudents: 45,
              failedStudents: 3,
              absentStudents: 2,
              averagePercentage: 68.5,
            },
          },
        },
      },
    },
  })
  async getStatistics(@Param('id') id: string) {
    return this.combineResultService.getStatistics(id);
  }

  @Get('exam-categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all active exam categories for dropdown' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam categories retrieved successfully',
    schema: {
      example: [
        {
          _id: '67f1f77bcf86cd799439101',
          categoryName: 'Class Test',
          description: 'Regular class tests',
          isActive: true,
        },
        {
          _id: '67f1f77bcf86cd799439102',
          categoryName: 'Mid Term',
          description: 'Mid-term examinations',
          isActive: true,
        },
      ],
    },
  })
  async getExamCategories() {
    return this.combineResultService.getExamCategories();
  }
}