import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsArray, 
  ValidateNested,
  IsMongoId,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

class SubjectMarkDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  obtainedMarks: number;
}

export class CreateResultDto {
  @IsNotEmpty()
  @IsMongoId()
  exam: string;

  @IsNotEmpty()
  @IsMongoId()
  student: string;

  @IsNotEmpty()
  @IsMongoId()
  class: string;

  @IsNotEmpty()
  @IsMongoId()
  batch: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5.0)
  gpa?: number;

  @IsOptional()
  @IsBoolean()
  isPassed?: boolean;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean = false;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectMarkDto)
  subjectWiseMarks?: SubjectMarkDto[];
}