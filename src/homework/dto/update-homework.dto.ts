import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkDto } from './create-homework.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsMongoId, ValidateIf } from 'class-validator';

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {
  @ApiProperty({ 
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'], 
    description: 'Array of batch IDs',
    required: false 
  })
  @ValidateIf(o => o.batches !== undefined)
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  batches?: string[];
}