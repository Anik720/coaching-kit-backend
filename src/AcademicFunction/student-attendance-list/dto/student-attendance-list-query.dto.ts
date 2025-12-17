import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsDateString,
  IsBooleanString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from './create-student-attendance-list.dto';

export class StudentAttendanceListQueryDto {
  @ApiPropertyOptional({ description: 'Search in remarks or begin field' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsMongoId()
  class?: string;

  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsOptional()
  @IsMongoId()
  batch?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @IsMongoId()
  student?: string;

  @ApiPropertyOptional({ description: 'Filter by exact date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Filter by createdBy user ID' })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by isActive (true/false)', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'Filter by min vitalTherm value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minTherm?: number;

  @ApiPropertyOptional({ description: 'Filter by max vitalTherm value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxTherm?: number;

  @ApiPropertyOptional({ description: 'Filter by min vitalPerm value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPerm?: number;

  @ApiPropertyOptional({ description: 'Filter by max vitalPerm value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPerm?: number;

  @ApiPropertyOptional({ description: 'Filter by min vitalAsem value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAsem?: number;

  @ApiPropertyOptional({ description: 'Filter by max vitalAsem value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAsem?: number;

  @ApiPropertyOptional({ 
    description: 'Sort field', 
    enum: ['attendanceDate', 'createdAt', 'updatedAt', 'vitalTherm', 'vitalPerm', 'vitalAsem'],
    default: 'attendanceDate' 
  })
  @IsOptional()
  @IsEnum(['attendanceDate', 'createdAt', 'updatedAt', 'vitalTherm', 'vitalPerm', 'vitalAsem'])
  sortBy?: string = 'attendanceDate';

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'],
    default: 'desc' 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}