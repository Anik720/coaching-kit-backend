import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';

export class UpdateExamCategoryDto {
  @ApiProperty({ 
    example: 'Quarterly Exams Updated', 
    description: 'Updated name of the exam category',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  categoryName?: string;

  @ApiProperty({ 
    example: 'Updated quarterly examination category', 
    description: 'Updated description',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: false, 
    description: 'Updated active status',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}