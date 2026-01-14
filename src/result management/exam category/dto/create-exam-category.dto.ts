import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateExamCategoryDto {
  @ApiProperty({ example: 'Quarterly Exams', description: 'Name of the exam category' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  categoryName: string;

  @ApiProperty({ 
    example: 'Quarterly examination category', 
    description: 'Description of the exam category',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Active status of the exam category',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}