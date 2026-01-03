import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBooleanString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  className?: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  group?: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  subject?: string;

  @IsOptional()
  @IsString()
  sessionYear?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['active', 'inactive', 'completed', 'upcoming'])
  status?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}