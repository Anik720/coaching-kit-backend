import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBooleanString,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamCategory, ExamStatus } from '../exam.schema';


export class ExamQueryDto {
  @ApiPropertyOptional({ description: 'Search by exam name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsMongoId()
  class?: string;

  @ApiPropertyOptional({ description: 'Filter by subject ID' })
  @IsOptional()
  @IsMongoId()
  subject?: string;

  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsOptional()
  @IsMongoId()
  batch?: string;

  @ApiPropertyOptional({ enum: ExamCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(ExamCategory)
  category?: ExamCategory;

  @ApiPropertyOptional({ enum: ExamStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'Filter by date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}