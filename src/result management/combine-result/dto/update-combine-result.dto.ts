import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsEnum, 
  IsBoolean,
  IsMongoId
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
    example: '67f1f77bcf86cd799439102', 
    description: 'Updated exam category ID',
    required: false 
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
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