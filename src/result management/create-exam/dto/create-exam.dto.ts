// src/result-management/exam/dto/create-exam.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsArray, 
  IsDate, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsMongoId,
  Min,
  Max,
  ArrayMinSize,
  ArrayContains,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';

// Valid marks fields
const VALID_MARKS_FIELDS = ['mcq', 'cq', 'written'];

export class CreateExamDto {
  @ApiProperty({ example: 'Mid-Term Examination 2025', description: 'Name of the exam' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ example: 'Algebra & Geometry', description: 'Topic name for the exam', required: false })
  @IsString()
  @IsOptional()
  topicName?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Class ID' })
  @IsMongoId()
  classId: string;

  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'], 
    description: 'Array of batch IDs' 
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  batchIds: string[];

  @ApiProperty({ example: '507f1f77bcf86cd799439014', description: 'Subject ID' })
  @IsMongoId()
  subjectId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439015', description: 'Exam category ID' })
  @IsMongoId()
  examCategoryId: string;

  @ApiProperty({ example: '2024-12-25', description: 'Exam date' })
  @IsDate()
  @Type(() => Date)
  examDate: Date;

  @ApiProperty({ 
    example: true, 
    description: 'Show marks title (MCQ, CQ, Written) in Result PDF',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  showMarksTitle?: boolean;

  @ApiProperty({ 
    example: ['mcq', 'cq', 'written'], 
    description: 'Selected marks fields',
    required: false,
    enum: VALID_MARKS_FIELDS
  })
  @IsArray()
  @IsOptional()
  @IsIn(VALID_MARKS_FIELDS, { each: true })
  selectedMarksFields?: string[];

  @ApiProperty({ example: 100, description: 'Total marks for the exam', minimum: 1, maximum: 1000 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalMarks: number;

  @ApiProperty({ 
    example: true, 
    description: 'Enable grading system',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  enableGrading?: boolean;

  @ApiProperty({ 
    example: 40, 
    description: 'Pass marks (absolute value, not percentage)',
    minimum: 0,
    required: false 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  passMarks?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Include % marks in result reports',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  showPercentageInResult?: boolean;

  @ApiProperty({ 
    example: false, 
    description: 'Include GPA grading in result reports',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  showGPAInResult?: boolean;

  @ApiProperty({ 
    example: false, 
    description: 'Use GPA system for grading',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  useGPASystem?: boolean;

  @ApiProperty({ 
    example: 'Additional instructions for the exam', 
    description: 'Exam instructions or notes',
    required: false 
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ 
    example: 180, 
    description: 'Exam duration in minutes',
    required: false,
    default: 180 
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  duration?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Active status of the exam',
    default: true 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}