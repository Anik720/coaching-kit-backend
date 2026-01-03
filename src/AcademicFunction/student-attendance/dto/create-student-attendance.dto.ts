import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AttendanceType } from '../student-attendance.schema';

export class CreateStudentAttendanceDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Class ObjectId' })
  @IsMongoId()
  class: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Batch ObjectId' })
  @IsMongoId()
  batch: string;

  @ApiProperty({
    example: '2025-12-14',
    description: 'Attendance date (ISO date string). Time portion is ignored.',
  })
  @IsDateString()
  attendanceDate: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Class start time (HH:mm, 24h).',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'classStartTime must be in HH:mm (24h) format',
  })
  classStartTime?: string;

  @ApiPropertyOptional({
    example: '10:30',
    description: 'Class end time (HH:mm, 24h).',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'classEndTime must be in HH:mm (24h) format',
  })
  classEndTime?: string;

  @ApiPropertyOptional({
    enum: AttendanceType,
    example: AttendanceType.PRESENT,
    description: 'Attendance type/status',
  })
  @IsOptional()
  @IsEnum(AttendanceType)
  attendanceType?: AttendanceType;

  @ApiPropertyOptional({ example: 'Regular class', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}