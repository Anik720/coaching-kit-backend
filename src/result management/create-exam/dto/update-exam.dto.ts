// src/result-management/exam/dto/update-exam.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsArray, 
  IsDate, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsMongoId,
  Min,
  Max,
  ArrayMinSize,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';

// Valid marks fields
const VALID_MARKS_FIELDS = ['mcq', 'cq', 'written'];

export class UpdateExamDto {
  @ApiProperty({ example: 'Updated Exam Name', description: 'Updated name of the exam', required: false })
  @IsString()
  @IsOptional()
  examName?: string;

  @ApiProperty({ example: 'Updated Topic', description: 'Updated topic name', required: false })
  @IsString()
  @IsOptional()
  topicName?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Updated class ID', required: false })
  @IsMongoId()
  @IsOptional()
  classId?: string;

  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'], 
    description: 'Updated array of batch IDs',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  batchIds?: string[];

  @ApiProperty({ example: '507f1f77bcf86cd799439014', description: 'Updated subject ID', required: false })
  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439015', description: 'Updated exam category ID', required: false })
  @IsMongoId()
  @IsOptional()
  examCategoryId?: string;

  @ApiProperty({ example: '2024-12-26', description: 'Updated exam date', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  examDate?: Date;

  @ApiProperty({ 
    example: true, 
    description: 'Updated show marks title setting',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  showMarksTitle?: boolean;

  @ApiProperty({ 
    example: ['mcq', 'cq'], 
    description: 'Updated selected marks fields',
    required: false,
    enum: VALID_MARKS_FIELDS
  })
  @IsArray()
  @IsOptional()
  @IsIn(VALID_MARKS_FIELDS, { each: true })
  selectedMarksFields?: string[];

  @ApiProperty({ example: 120, description: 'Updated total marks', minimum: 1, maximum: 1000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  totalMarks?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Updated grading system setting',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  enableGrading?: boolean;

  @ApiProperty({ 
    example: 45, 
    description: 'Updated pass marks',
    minimum: 0,
    required: false 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  passMarks?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Updated show percentage in result',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  showPercentageInResult?: boolean;

  @ApiProperty({ 
    example: false, 
    description: 'Updated show GPA in result',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  showGPAInResult?: boolean;

  @ApiProperty({ 
    example: true, 
    description: 'Updated use GPA system',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  useGPASystem?: boolean;

  @ApiProperty({ 
    example: 'Updated instructions for the exam', 
    description: 'Updated exam instructions',
    required: false 
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ 
    example: 150, 
    description: 'Updated exam duration in minutes',
    required: false 
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  duration?: number;

  @ApiProperty({ 
    example: false, 
    description: 'Updated active status',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}