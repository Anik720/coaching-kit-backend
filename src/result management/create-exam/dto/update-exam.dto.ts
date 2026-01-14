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
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { MarkTitleDto, GradeDto } from './create-exam.dto'; // Add this import

export class UpdateExamDto {
  @ApiProperty({ example: 'Test Xitu Updated', description: 'Updated name of the exam', required: false })
  @IsString()
  @IsOptional()
  examName?: string;

  @ApiProperty({ example: 'Test Fire Updated', description: 'Updated topic name', required: false })
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
    example: false, 
    description: 'Updated show marks title setting',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  showMarksTitle?: boolean;

  @ApiProperty({ 
    example: [
      { title: 'Theory', marks: 40, passMarks: 20 },
      { title: 'Practical', marks: 60, passMarks: 30 }
    ], 
    description: 'Updated mark titles configuration',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MarkTitleDto)
  markTitles?: MarkTitleDto[];

  @ApiProperty({ example: 120, description: 'Updated total marks', minimum: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalMarks?: number;

  @ApiProperty({ 
    example: false, 
    description: 'Updated grading system setting',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  enableGrading?: boolean;

  @ApiProperty({ example: 40, description: 'Updated pass marks percentage', minimum: 0, maximum: 100, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passMarksPercentage?: number;

  @ApiProperty({ 
    example: [
      { grade: 'A+', description: 'Outstanding', minPercentage: 90, maxPercentage: 100 },
      { grade: 'A', description: 'Excellent', minPercentage: 80, maxPercentage: 89 }
    ], 
    description: 'Updated grading configuration',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GradeDto)
  grades?: GradeDto[];

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