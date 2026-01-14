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
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export class MarkTitleDto {
  @ApiProperty({ example: 'MCQ', description: 'Title for marks section' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 20, description: 'Marks for this section', minimum: 0 })
  @IsNumber()
  @Min(0)
  marks: number;

  @ApiProperty({ example: 10, description: 'Pass marks for this section', minimum: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  passMarks?: number;
}

export class GradeDto {
  @ApiProperty({ example: 'A+', description: 'Grade name' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: 'Excellent', description: 'Grade description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 80, description: 'Minimum percentage for this grade', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage: number;

  @ApiProperty({ example: 100, description: 'Maximum percentage for this grade', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage: number;
}

export class CreateExamDto {
  @ApiProperty({ example: 'Test Xitu', description: 'Name of the exam' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ example: 'Test Fire', description: 'Topic name for the exam' })
  @IsString()
  @IsNotEmpty()
  topicName: string;

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
    description: 'Show marks title in result PDF',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  showMarksTitle?: boolean;

  @ApiProperty({ 
    example: [
      { title: 'MCQ', marks: 20, passMarks: 10 },
      { title: 'CQ', marks: 30, passMarks: 15 },
      { title: 'Written', marks: 50, passMarks: 25 }
    ], 
    description: 'Mark titles configuration',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MarkTitleDto)
  markTitles?: MarkTitleDto[];

  @ApiProperty({ example: 100, description: 'Total marks for the exam', minimum: 0 })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiProperty({ 
    example: true, 
    description: 'Enable grading system',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  enableGrading?: boolean;

  @ApiProperty({ example: 33, description: 'Pass marks percentage', minimum: 0, maximum: 100, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passMarksPercentage?: number;

  @ApiProperty({ 
    example: [
      { grade: 'A+', description: 'Excellent', minPercentage: 80, maxPercentage: 100 },
      { grade: 'A', description: 'Very Good', minPercentage: 70, maxPercentage: 79 },
      { grade: 'B', description: 'Good', minPercentage: 60, maxPercentage: 69 },
      { grade: 'C', description: 'Satisfactory', minPercentage: 50, maxPercentage: 59 },
      { grade: 'D', description: 'Pass', minPercentage: 33, maxPercentage: 49 },
      { grade: 'F', description: 'Fail', minPercentage: 0, maxPercentage: 32 }
    ], 
    description: 'Grading configuration',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GradeDto)
  grades?: GradeDto[];

  @ApiProperty({ 
    example: 'Additional instructions for the exam', 
    description: 'Exam instructions or notes',
    required: false 
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ 
    example: 120, 
    description: 'Exam duration in minutes',
    required: false 
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