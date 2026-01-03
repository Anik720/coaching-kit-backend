import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  IsDate,
  MinDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamCategory } from '../exam.schema';


export class MarksDistributionDto {
  @ApiProperty({ example: 'MCQ', description: 'Type of marks' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 20, description: 'Marks for this type' })
  @IsNumber()
  @Min(0)
  marks: number;
}

export class GradingSystemDto {
  @ApiProperty({ example: 'A+', description: 'Grade label' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: 80, description: 'Minimum marks for this grade' })
  @IsNumber()
  @Min(0)
  minMarks: number;

  @ApiProperty({ example: 100, description: 'Maximum marks for this grade' })
  @IsNumber()
  @Min(0)
  maxMarks: number;

  @ApiProperty({ example: 5.0, description: 'Grade points' })
  @IsNumber()
  @Min(0)
  points: number;
}

export class CreateExamDto {
  @ApiProperty({ example: 'Midterm Exam - Physics', description: 'Exam name' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Class ID' })
  @IsMongoId()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Subject ID' })
  @IsMongoId()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    description: 'Array of Batch IDs',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  batches: string[];

  @ApiProperty({
    example: 'midterm',
    enum: ExamCategory,
    description: 'Exam category',
  })
  @IsEnum(ExamCategory)
  @IsNotEmpty()
  category: ExamCategory;

  @ApiProperty({ example: '2024-03-15', description: 'Exam date' })
  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @ApiProperty({ example: '2024-03-15T09:00:00.000Z', description: 'Start time' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2024-03-15T12:00:00.000Z', description: 'End time' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: true, description: 'Show marks in result' })
  @IsBoolean()
  @IsOptional()
  showMarksInResult?: boolean;

  @ApiPropertyOptional({
    type: [MarksDistributionDto],
    description: 'Marks distribution',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MarksDistributionDto)
  marksDistribution?: MarksDistributionDto[];

  @ApiPropertyOptional({ example: 100, description: 'Total marks' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalMarks?: number;

  @ApiPropertyOptional({ example: true, description: 'Enable grading system' })
  @IsBoolean()
  @IsOptional()
  enableGrading?: boolean;

  @ApiPropertyOptional({
    type: [GradingSystemDto],
    description: 'Grading system configuration',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GradingSystemDto)
  gradingSystem?: GradingSystemDto[];

  @ApiPropertyOptional({ example: 40, description: 'Pass marks percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passMarks?: number;

  @ApiPropertyOptional({ example: 'Exam instructions...', description: 'Instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Exam location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}