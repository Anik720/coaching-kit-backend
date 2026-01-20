import { 
  IsOptional, 
  IsNumber, 
  IsString, 
  IsBoolean, 
  IsArray, 
  ValidateNested,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

class SubjectMarkDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  obtainedMarks?: number;
}

export class UpdateResultDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  obtainedMarks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5.0)
  gpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isPassed?: boolean;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @IsOptional()
  @IsString()
  resultClass?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectMarkDto)
  subjectWiseMarks?: SubjectMarkDto[];
}