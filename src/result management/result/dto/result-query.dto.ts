import { 
  IsOptional, 
  IsString, 
  IsBoolean, 
  IsNumber, 
  Min, 
  Max 
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ResultQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  exam?: string;

  @IsOptional()
  @IsString()
  student?: string;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsOptional()
  @IsString()
  subject?: string; // New filter by subject ID

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isPassed?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAbsent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}