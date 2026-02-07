import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsArray, 
  IsDateString, 
  IsOptional,
  IsBoolean,
  ArrayNotEmpty,
  IsMongoId
} from 'class-validator';

export class CreateCombineResultDto {
  @ApiProperty({ example: 'HSC 2027 Combined Result', description: 'Name of the combined result' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '67f1f77bcf86cd799439011', description: 'Class ID' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  class: string;

  @ApiProperty({ 
    example: ['67f1f77bcf86cd799439012', '67f1f77bcf86cd799439013'], 
    description: 'Array of batch IDs' 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  batches: string[];

  @ApiProperty({ 
    example: ['67f1f77bcf86cd799439021', '67f1f77bcf86cd799439022'], 
    description: 'Array of exam IDs to combine' 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  exams: string[];

  @ApiProperty({ 
    example: '67f1f77bcf86cd799439101', 
    description: 'Exam Category ID from exam-category collection' 
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
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
    example: '67f1f77bcf86cd799439101', 
    description: 'Exam Category ID',
    required: false 
  })
  @IsString()
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