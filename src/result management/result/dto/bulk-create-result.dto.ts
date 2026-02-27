import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsObject, 
  ValidateNested,
  IsMongoId, 
  Min,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';

export class StudentResultDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  only_total_marks: number;

  @IsOptional()
  @IsString()
  grade?: string = 'N/A';

  @IsOptional()
  @IsString()
  gpa?: string = 'N/A';

  @IsOptional()
  @IsBoolean()
  is_passed?: boolean = false;

  @IsOptional()
  @IsBoolean()
  is_absent?: boolean = false;
}

export class BulkCreateResultDto {
  @IsNotEmpty()
  @IsMongoId()
  exam_id: string;

  @IsNotEmpty()
  @IsObject()
  results: Record<string, StudentResultDto>;
}