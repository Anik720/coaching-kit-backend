import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  MaxLength,
  IsEnum,
  IsBoolean,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  batchName: string;

  @IsMongoId()
  @IsNotEmpty()
  className: string;

  @IsMongoId()
  @IsNotEmpty()
  group: string;

  @IsMongoId()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  @MaxLength(9)
  sessionYear?: string;

  @IsDateString()
  @IsNotEmpty()
  batchStartingDate: string;

  @IsDateString()
  @IsNotEmpty()
  batchClosingDate: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  admissionFee: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tuitionFee: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  courseFee: number;

  @IsString()
  @IsOptional()
  @IsEnum(['active', 'inactive', 'completed', 'upcoming'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  maxStudents?: number;

  @IsMongoId()
  @IsOptional() // Changed from @IsNotEmpty() to @IsOptional()
  createdBy?: string; // Make it optional
}