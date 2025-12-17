import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentAttendanceListDto } from './create-student-attendance-list.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsMongoId, ValidateIf } from 'class-validator';

export class UpdateStudentAttendanceListDto extends PartialType(CreateStudentAttendanceListDto) {
  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439011', 
    description: 'Class ID' 
  })
  @ValidateIf(o => o.class !== undefined)
  @IsMongoId()
  @IsOptional()
  class?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439012', 
    description: 'Batch ID' 
  })
  @ValidateIf(o => o.batch !== undefined)
  @IsMongoId()
  @IsOptional()
  batch?: string;

  @ApiPropertyOptional({ 
    example: '507f1f77bcf86cd799439013', 
    description: 'Student ID' 
  })
  @ValidateIf(o => o.student !== undefined)
  @IsMongoId()
  @IsOptional()
  student?: string;
}