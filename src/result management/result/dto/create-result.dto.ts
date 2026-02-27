import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, IsMongoId, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubjectMarkDto {
  @ApiProperty({ description: 'Subject ID' })
  @IsMongoId()
  subject: string;

  @ApiProperty({ description: 'Subject name' })
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiProperty({ description: 'Total marks for the subject' })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiProperty({ description: 'Obtained marks for the subject' })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;
}

export class CreateResultDto {
  @ApiProperty({ description: 'Exam ID' })
  @IsMongoId()
  exam: string;

  @ApiProperty({ description: 'Student ID' })
  @IsMongoId()
  student: string;

  @ApiProperty({ description: 'Class ID' })
  @IsMongoId()
  class: string;

  @ApiProperty({ description: 'Batch ID' })
  @IsMongoId()
  batch: string;

  @ApiProperty({ description: 'Total marks' })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiProperty({ description: 'Obtained marks' })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @ApiProperty({ description: 'Grade (optional - will be auto-calculated)', required: false })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({ description: 'GPA (optional - will be auto-calculated)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  gpa?: number;

  @ApiProperty({ description: 'Result class (optional - will be auto-calculated)', required: false })
  @IsOptional()
  @IsString()
  resultClass?: string;

  @ApiProperty({ description: 'Is student absent?', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiProperty({ description: 'Remarks (optional - will be auto-calculated)', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [SubjectMarkDto], description: 'Subject-wise marks', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectMarkDto)
  subjectWiseMarks?: SubjectMarkDto[];
}