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
import { BatchListResponseDto, BatchResponseDto, ClassResponse, GroupResponse, SubjectResponse } from './dto/batch-response.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { Batch } from './batch.schema';
import { BatchQueryDto } from './dto/batch-query.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@ApiTags('batches')
@ApiBearerAuth()
@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Batch created successfully',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Batch already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createBatchDto: CreateBatchDto): Promise<BatchResponseDto> {
    const batch = await this.batchService.create(createBatchDto);
    return this.serializeBatch(batch);
  }

  @Get()
  @ApiOperation({ summary: 'Get all batches with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of batches',
    type: BatchListResponseDto,
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'className', required: false, type: String })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'sessionYear', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'completed', 'upcoming'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: BatchQueryDto): Promise<BatchListResponseDto> {
    const result = await this.batchService.findAll(query);
    
    const data = result.data.map(batch => this.serializeBatch(batch));
    
    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get batch statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch statistics',
  })
  async getStats(): Promise<IBatchStats> {
    return await this.batchService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch by ID' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch details',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
  })
  async findOne(@Param('id') id: string): Promise<BatchResponseDto> {
    const batch = await this.batchService.findOne(id);
    return this.serializeBatch(batch);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check batch availability for enrollment' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch availability status',
  })
  async checkAvailability(@Param('id') id: string) {
    return await this.batchService.checkBatchAvailability(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch updated successfully',
    type: BatchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Batch already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ): Promise<BatchResponseDto> {
    const batch = await this.batchService.update(id, updateBatchDto);
    return this.serializeBatch(batch);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle batch active status' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch status toggled successfully',
    type: BatchResponseDto,
  })
  async toggleStatus(@Param('id') id: string): Promise<BatchResponseDto> {
    const batch = await this.batchService.toggleStatus(id);
    return this.serializeBatch(batch);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a batch' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Batch deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.batchService.remove(id);
  }

  @Get('date-range/:startDate/:endDate')
  @ApiOperation({ summary: 'Get batches within a date range' })
  @ApiParam({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiParam({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batches within date range',
    type: [BatchResponseDto],
  })
  async getByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ): Promise<BatchResponseDto[]> {
    const batches = await this.batchService.getBatchesByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
    return batches.map(batch => this.serializeBatch(batch));
  }

  /**
   * Serialize Mongoose document to BatchResponseDto
   */
  private serializeBatch(batch: any): BatchResponseDto {
    // The service layer should already handle not found cases
    // So batch should never be null here
    if (!batch) {
      // If somehow batch is null, throw an error
      throw new NotFoundException('Batch not found');
    }

    // Convert Mongoose document to plain object
    const plainBatch = batch.toObject ? batch.toObject() : batch;

    // Calculate additional fields
    const batchStartingDate = new Date(plainBatch.batchStartingDate);
    const batchClosingDate = new Date(plainBatch.batchClosingDate);
    const today = new Date();
    
    const totalFee = plainBatch.admissionFee + plainBatch.tuitionFee + plainBatch.courseFee;
    const daysRemaining = Math.ceil((batchClosingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isActiveSession = today >= batchStartingDate && today <= batchClosingDate && plainBatch.isActive;

    // Handle populated fields - ensure they're always properly formatted
    let className: string | ClassResponse;
    if (plainBatch.className) {
      if (typeof plainBatch.className === 'string') {
        className = plainBatch.className;
      } else if (plainBatch.className._id) {
        className = {
          _id: plainBatch.className._id.toString(),
          classname: plainBatch.className.classname,
        };
      } else {
        className = plainBatch.className.toString();
      }
    } else {
      // If className is not populated, return the ObjectId as string
      className = plainBatch.className?.toString() || '';
    }

    let group: string | GroupResponse;
    if (plainBatch.group) {
      if (typeof plainBatch.group === 'string') {
        group = plainBatch.group;
      } else if (plainBatch.group._id) {
        group = {
          _id: plainBatch.group._id.toString(),
          groupName: plainBatch.group.groupName,
        };
      } else {
        group = plainBatch.group.toString();
      }
    } else {
      group = plainBatch.group?.toString() || '';
    }

    let subject: string | SubjectResponse;
    if (plainBatch.subject) {
      if (typeof plainBatch.subject === 'string') {
        subject = plainBatch.subject;
      } else if (plainBatch.subject._id) {
        subject = {
          _id: plainBatch.subject._id.toString(),
          subjectName: plainBatch.subject.subjectName,
        };
      } else {
        subject = plainBatch.subject.toString();
      }
    } else {
      subject = plainBatch.subject?.toString() || '';
    }

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
      isActive: plainBatch.isActive !== undefined ? plainBatch.isActive : true,
      description: plainBatch.description || '',
      maxStudents: plainBatch.maxStudents || 50,
      createdAt: plainBatch.createdAt,
      updatedAt: plainBatch.updatedAt,
      totalFee,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      isActiveSession,
    };
  }
}