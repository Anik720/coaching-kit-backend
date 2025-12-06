// admission/admission.controller.ts

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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { AdmissionService } from './admission.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';

@ApiTags('admissions')
@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create new admission (can be incomplete)' })
  @ApiResponse({ status: 201, description: 'Admission created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createAdmissionDto: CreateAdmissionDto,
    @UploadedFile() photo?: any,
  ): Promise<AdmissionResponseDto> {
    // Handle photo upload if provided
    if (photo) {
      // createAdmissionDto.photoUrl = await this.uploadPhoto(photo);
      // createAdmissionDto.photoPath = photo.path;
    }

    console.log('Received DTO:', createAdmissionDto); // Debug log
    
    const admission = await this.admissionService.create(createAdmissionDto);
    return this.mapToResponseDto(admission);
  }

  @Put(':registrationId')
  @ApiOperation({ summary: 'Update admission by registration ID' })
  @ApiResponse({ status: 200, description: 'Admission updated successfully' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('registrationId') registrationId: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
    @UploadedFile() photo?: any,
  ): Promise<AdmissionResponseDto> {
    // Handle photo upload if provided
    if (photo) {
      // updateAdmissionDto.photoUrl = await this.uploadPhoto(photo);
      // updateAdmissionDto.photoPath = photo.path;
    }

    const admission = await this.admissionService.update(
      registrationId, 
      updateAdmissionDto
    );
    return this.mapToResponseDto(admission);
  }

  @Get(':registrationId')
  @ApiOperation({ summary: 'Get admission by registration ID' })
  @ApiResponse({ status: 200, description: 'Admission details' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  async findOne(@Param('registrationId') registrationId: string): Promise<AdmissionResponseDto> {
    const admission = await this.admissionService.findByRegistrationId(registrationId);
    return this.mapToResponseDto(admission);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admissions with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of admissions' })
  async findAll(
    @Query('status') status?: string,
    @Query('isCompleted') isCompleted?: string,
    @Query('admissionType') admissionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
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
    const filters: any = {};
    
    if (status) filters.status = status;
    if (isCompleted !== undefined) filters.isCompleted = isCompleted === 'true';
    if (admissionType) filters.admissionType = admissionType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (search) filters.search = search;

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
  @ApiOperation({ summary: 'Delete admission by registration ID' })
  @ApiResponse({ status: 200, description: 'Admission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  async delete(@Param('registrationId') registrationId: string): Promise<{ message: string }> {
    await this.admissionService.delete(registrationId);
    return { message: 'Admission deleted successfully' };
  }

  @Get('statistics/summary')
  @ApiOperation({ summary: 'Get admission statistics' })
  @ApiResponse({ status: 200, description: 'Admission statistics' })
  async getStatistics(): Promise<any> {
    return await this.admissionService.getStatistics();
  }

  @Get('search/quick')
  @ApiOperation({ summary: 'Quick search admissions' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async quickSearch(
    @Query('q') query: string,
  ): Promise<AdmissionResponseDto[]> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const result = await this.admissionService.findAll({ search: query }, { limit: 20 });
    return result.admissions.map(admission => this.mapToResponseDto(admission));
  }

  // Helper method to map admission to response DTO
  private mapToResponseDto(admission: any): AdmissionResponseDto {
    return {
      registrationId: admission.registrationId,
      name: admission.name,
      nameNative: admission.nameNative,
      studentGender: admission.studentGender,
      studentDateOfBirth: admission.studentDateOfBirth,
      age: admission.age,
      presentAddress: admission.presentAddress,
      permanentAddress: admission.permanentAddress,
      religion: admission.religion,
      whatsappMobile: admission.whatsappMobile,
      studentMobileNumber: admission.studentMobileNumber,
      instituteName: admission.instituteName,
      fathersName: admission.fathersName,
      mothersName: admission.mothersName,
      guardianMobileNumber: admission.guardianMobileNumber,
      motherMobileNumber: admission.motherMobileNumber,
      admissionType: admission.admissionType,
      courseFee: admission.courseFee,
      admissionFee: admission.admissionFee,
      tuitionFee: admission.tuitionFee,
      referBy: admission.referBy,
      admissionDate: admission.admissionDate,
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
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
    };
  }
}