import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
  HALF_DAY = 'half_day',
}

export class CreateStudentAttendanceListDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Class ID' })
  @IsMongoId()
  @IsNotEmpty()
  class: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Batch ID' })
  @IsMongoId()
  @IsNotEmpty()
  batch: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Student ID' })
  @IsMongoId()
  @IsNotEmpty()
  student: string;

  @ApiProperty({ 
    example: '2025-12-13', 
    description: 'Attendance date (YYYY-MM-DD)' 
  })
  @IsDateString()
  @IsNotEmpty()
  @Transform(({ value }) => value.split('T')[0]) // Extract date part only
  attendanceDate: string;

  @ApiProperty({ 
    enum: AttendanceStatus, 
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status' 
  })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @ApiPropertyOptional({ 
    example: 54, 
    description: 'Vital Therm measurement (0-100)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vitalTherm?: number;

  @ApiPropertyOptional({ 
    example: 32, 
    description: 'Vital Perm measurement (0-100)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vitalPerm?: number;

  @ApiPropertyOptional({ 
    example: 22, 
    description: 'Vital Asem measurement (0-100)' 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vitalAsem?: number;

  @ApiPropertyOptional({ 
    example: '542 (FM)', 
    description: 'Begin time/notes' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  begin?: string;

  @ApiPropertyOptional({ 
    example: 'Regular attendance', 
    description: 'Additional remarks' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Active status',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}