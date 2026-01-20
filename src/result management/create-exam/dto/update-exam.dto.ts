// src/result-management/exam/dto/update-exam.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsArray, 
  IsDate, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  Min,
  Max,
  ValidateNested,
  IsNotEmpty
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

export class UpdateExamDto {
  @ApiProperty({ example: 'Updated Exam Name', description: 'Updated name of the exam', required: false })
  @IsString()
  @IsOptional()
  examName?: string;

  @ApiProperty({ example: 'Updated Topic', description: 'Updated topic name', required: false })
  @IsString()
  @IsOptional()
  topicName?: string;

  @ApiProperty({ example: 'Updated Class', description: 'Updated class name', required: false })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiProperty({ example: 'Updated Batch', description: 'Updated batch name', required: false })
  @IsString()
  @IsOptional()
  batchName?: string;

  @ApiProperty({ example: 'Updated Subject', description: 'Updated subject name', required: false })
  @IsString()
  @IsOptional()
  subjectName?: string;

  @ApiProperty({ example: 'Updated Category', description: 'Updated exam category', required: false })
  @IsString()
  @IsOptional()
  examCategory?: string;

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
    type: [MarksFieldDto],
    description: 'Updated marks fields configuration',
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MarksFieldDto)
  marksFields?: MarksFieldDto[];

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
    description: 'Updated total pass marks',
    minimum: 0,
    required: false 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalPassMarks?: number;

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
}