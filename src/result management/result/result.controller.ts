import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';


import { ResultService } from './result.service';
import { CreateResultDto } from './dto/create-result.dto';
import { BulkCreateResultDto } from './dto/bulk-create-result.dto';

import { ResultQueryDto } from './dto/result-query.dto';

import { IResultStats, IResultSummary, IBulkResultResponse, IStudentResult } from './interfaces/result.interface';
import { UserRole } from 'src/shared/interfaces/user.interface';
import { ResultResponseDto } from './dto/result-response.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@ApiTags('results')
@ApiBearerAuth()
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new result' })
  @ApiResponse({ status: 201, description: 'Result created successfully', type: ResultResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Exam or student not found' })
  @ApiResponse({ status: 409, description: 'Result already exists' })
  async create(
    @Body() createResultDto: CreateResultDto,
    @Request() req,
  ): Promise<ResultResponseDto> {
    return this.resultService.create(createResultDto, req.user.userId);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create multiple results in bulk' })
  @ApiBody({ type: BulkCreateResultDto })
  @ApiResponse({ status: 201, description: 'Results created successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Exam or students not found' })
  async bulkCreate(
    @Body() bulkCreateResultDto: BulkCreateResultDto,
    @Request() req,
  ): Promise<IBulkResultResponse> {
    return this.resultService.bulkCreate(bulkCreateResultDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all results with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'exam', required: false, type: String })
  @ApiQuery({ name: 'student', required: false, type: String })
  @ApiQuery({ name: 'class', required: false, type: String })
  @ApiQuery({ name: 'batch', required: false, type: String })
  @ApiQuery({ name: 'isPassed', required: false, type: Boolean })
  @ApiQuery({ name: 'isAbsent', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  async findAll(@Query() queryDto: ResultQueryDto): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.resultService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a result by ID' })
  @ApiParam({ name: 'id', description: 'Result ID' })
  @ApiResponse({ status: 200, description: 'Result retrieved successfully', type: ResultResponseDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async findOne(@Param('id') id: string): Promise<ResultResponseDto> {
    return this.resultService.findOne(id);
  }

  @Get('exam/:examId/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get result by exam and student' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Result retrieved successfully', type: ResultResponseDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async findByExamAndStudent(
    @Param('examId') examId: string,
    @Param('studentId') studentId: string,
  ): Promise<ResultResponseDto> {
    return this.resultService.findByExamAndStudent(examId, studentId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a result' })
  @ApiParam({ name: 'id', description: 'Result ID' })
  @ApiResponse({ status: 200, description: 'Result updated successfully', type: ResultResponseDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async update(
    @Param('id') id: string,
    @Body() updateResultDto: UpdateResultDto,
    @Request() req,
  ): Promise<ResultResponseDto> {
    return this.resultService.update(id, updateResultDto, req.user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a result' })
  @ApiParam({ name: 'id', description: 'Result ID' })
  @ApiResponse({ status: 204, description: 'Result deleted successfully' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.resultService.remove(id);
  }

  @Get('exam/:examId/results')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all results for a specific exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Exam results retrieved successfully' })
  async getExamResults(
    @Param('examId') examId: string,
    @Query() queryDto: ResultQueryDto,
  ): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.resultService.getExamResults(examId, queryDto);
  }

  @Get('student/:studentId/results')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all results for a specific student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Student results retrieved successfully' })
  async getStudentResults(
    @Param('studentId') studentId: string,
    @Query() queryDto: ResultQueryDto,
  ): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.resultService.getStudentResults(studentId, queryDto);
  }

  @Get('exam/:examId/summary')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get result summary for an exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Result summary retrieved successfully' })
  async getResultSummary(@Param('examId') examId: string): Promise<IResultSummary> {
    return this.resultService.getResultSummary(examId);
  }

  @Get('stats/summary')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get result statistics' })
  @ApiQuery({ name: 'examId', required: false, type: String })
  @ApiQuery({ name: 'classId', required: false, type: String })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @Query('examId') examId?: string,
    @Query('classId') classId?: string,
    @Query('batchId') batchId?: string,
  ): Promise<IResultStats> {
    return this.resultService.getStats(examId, classId, batchId);
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Toggle result active status' })
  @ApiParam({ name: 'id', description: 'Result ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: ResultResponseDto })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async toggleActive(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ResultResponseDto> {
    return this.resultService.toggleActive(id, req.user.userId);
  }

  @Get('students/for-result-entry')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get students for result entry (based on class and batch)' })
  @ApiQuery({ name: 'classId', required: true, type: String })
  @ApiQuery({ name: 'batchId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  async getStudentsForResultEntry(
    @Query('classId') classId: string,
    @Query('batchId') batchId: string,
  ): Promise<IStudentResult[]> {
    return this.resultService.getStudentsForResultEntry(classId, batchId);
  }

  @Get('my/results')
  @Roles(UserRole.SUPER_ADMIN,UserRole.USER_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get results created by the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User results retrieved successfully' })
  async getMyResults(
    @Request() req,
    @Query() queryDto: ResultQueryDto,
  ): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.resultService.getResultsByCreator(req.user.userId, queryDto);
  }
  

  @Get('student/my-results')
  @Roles(UserRole.SUPER_ADMIN,UserRole.STUDENT)
  @ApiOperation({ summary: 'Get results for the logged in student' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Student results retrieved successfully' })
  async getMyStudentResults(
    @Request() req,
    @Query() queryDto: ResultQueryDto,
  ): Promise<{
    data: ResultResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Assuming student ID is stored in req.user.studentId
    const studentId = req.user.studentId || req.user.userId;
    return this.resultService.getStudentResults(studentId, queryDto);
  }
}