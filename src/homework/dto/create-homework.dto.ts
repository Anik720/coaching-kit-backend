import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHomeworkDto {
  @ApiProperty({ example: 'Math Assignment 1', description: 'Name of the homework' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  homeworkName: string;

  @ApiProperty({ 
    example: 'Complete exercises 1-10 from chapter 5', 
    description: 'Homework description',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'Class ID' 
  })
  @IsMongoId()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'], 
    description: 'Array of batch IDs' 
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  batches: string[];

  @ApiProperty({ 
    example: '507f1f77bcf86cd799439014', 
    description: 'Subject ID' 
  })
  @IsMongoId()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ 
    example: '2023-12-15', 
    description: 'Homework date (YYYY-MM-DD format)' 
  })
  @IsDateString()
  @IsNotEmpty()
  homeworkDate: string;

  @ApiProperty({ 
    example: true, 
    description: 'Active status',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}