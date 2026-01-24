// dto/create-combine-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsArray, 
  IsDateString, 
  IsEnum, 
  IsOptional,
  IsBoolean,
  ArrayNotEmpty,
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCombineResultDto {
  @ApiProperty({ example: 'HSC 2027 Combined Result', description: 'Name of the combined result' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '67f1f77bcf86cd799439011', description: 'Class ID' })
  @IsString()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ 
    example: ['67f1f77bcf86cd799439012', '67f1f77bcf86cd799439013'], 
    description: 'Array of batch IDs' 
  })
  @IsArray()
  @ArrayNotEmpty()
  batches: string[];

  @ApiProperty({ 
    example: ['67f1f77bcf86cd799439021', '67f1f77bcf86cd799439022'], 
    description: 'Array of exam IDs to combine' 
  })
  @IsArray()
  @ArrayNotEmpty()
  exams: string[];

  @ApiProperty({ 
    example: 'class_test', 
    enum: ['class_test', 'mid_term', 'final', 'mock_test', 'custom'],
    description: 'Category of the combined result' 
  })
  @IsEnum(['class_test', 'mid_term', 'final', 'mock_test', 'custom'])
  category: string;

  @ApiProperty({ example: '2024-01-01', description: 'Start date for exam filtering' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date for exam filtering' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    example: false, 
    description: 'Whether to publish immediately',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class SearchCombineResultDto {
  @ApiProperty({ example: '67f1f77bcf86cd799439011', description: 'Class ID', required: false })
  @IsString()
  @IsOptional()
  class?: string;

  @ApiProperty({ 
    example: ['67f1f77bcf86cd799439012'], 
    description: 'Array of batch IDs', 
    required: false 
  })
  @IsArray()
  @IsOptional()
  batches?: string[];

  @ApiProperty({ 
    example: 'class_test', 
    enum: ['class_test', 'mid_term', 'final', 'mock_test', 'custom'],
    description: 'Category of exam',
    required: false 
  })
  @IsEnum(['class_test', 'mid_term', 'final', 'mock_test', 'custom'])
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '2024-01-01', description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'published', description: 'Status filter', required: false })
  @IsString()
  @IsOptional()
  status?: 'published' | 'draft' | 'all';
}