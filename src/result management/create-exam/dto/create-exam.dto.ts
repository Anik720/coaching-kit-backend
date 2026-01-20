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
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class MarksFieldDto {
  @ApiProperty({ example: 'mcq', description: 'Type of marks field' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 30, description: 'Total marks for this field' })
  @IsNumber()
  @Min(0)
  @Max(1000)
  totalMarks: number;

  @ApiProperty({ example: true, description: 'Enable pass marks for this field', default: false })
  @IsBoolean()
  @IsOptional()
  enablePassMarks?: boolean;

  @ApiProperty({ example: 15, description: 'Pass marks for this field', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  passMarks?: number;

  @ApiProperty({ example: true, description: 'Enable negative marking for this field', default: false })
  @IsBoolean()
  @IsOptional()
  enableNegativeMarking?: boolean;

  @ApiProperty({ example: 0.5, description: 'Negative marks per wrong answer', required: false })
  @IsNumber()
  @IsOptional()
  negativeMarks?: number;
}

export class CreateExamDto {
  @ApiProperty({ example: 'tet', description: 'Name of the exam' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ example: 'adca', description: 'Topic name for the exam', required: false })
  @IsString()
  @IsOptional()
  topicName?: string;

  @ApiProperty({ example: 'HSC 2027', description: 'Class name' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({ example: 'SUN-3PM', description: 'Batch name' })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @ApiProperty({ example: 'Class Test', description: 'Exam category' })
  @IsString()
  @IsNotEmpty()
  examCategory: string;

  @ApiProperty({ example: '2026-01-16', description: 'Exam date' })
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
    type: [MarksFieldDto],
    description: 'Marks fields configuration',
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MarksFieldDto)
  marksFields?: MarksFieldDto[];

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
    description: 'Total pass marks (absolute value)',
    minimum: 0,
    required: false 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalPassMarks?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Show % marks in result reports',
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
}