// dto/update-combine-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsDateString, 
  IsEnum, 
  IsBoolean 
} from 'class-validator';

export class UpdateCombineResultDto {
  @ApiProperty({ example: 'Updated Combined Result', description: 'Updated name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: ['67f1f77bcf86cd799439014'], description: 'Updated batch IDs', required: false })
  @IsArray()
  @IsOptional()
  batches?: string[];

  @ApiProperty({ example: ['67f1f77bcf86cd799439023'], description: 'Updated exam IDs', required: false })
  @IsArray()
  @IsOptional()
  exams?: string[];

  @ApiProperty({ 
    example: 'mid_term', 
    enum: ['class_test', 'mid_term', 'final', 'mock_test', 'custom'],
    description: 'Updated category',
    required: false 
  })
  @IsEnum(['class_test', 'mid_term', 'final', 'mock_test', 'custom'])
  @IsOptional()
  category?: string;

  @ApiProperty({ example: true, description: 'Publish status', required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: false, description: 'Active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}