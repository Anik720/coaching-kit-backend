import { ApiProperty } from '@nestjs/swagger';
import { AttendanceType } from '../student-attendance.schema';

export class ClassRefDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'HSC 2027' })
  classname: string;
}

export class BatchRefDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  _id: string;

  @ApiProperty({ example: 'Batch A' })
  batchName: string;
}

export class UserRefDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439099' })
  _id: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;
}

export class StudentAttendanceResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  _id: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/ClassRefDto' }] })
  class: string | ClassRefDto;

  @ApiProperty({ oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/BatchRefDto' }] })
  batch: string | BatchRefDto;

  @ApiProperty({ example: '2025-12-14T00:00:00.000Z' })
  attendanceDate: Date;

  @ApiProperty({ required: false, example: '09:00' })
  classStartTime?: string;

  @ApiProperty({ required: false, example: '10:30' })
  classEndTime?: string;

  @ApiProperty({ enum: AttendanceType, example: AttendanceType.PRESENT })
  attendanceType: AttendanceType;

  @ApiProperty({ required: false, example: 'Regular class' })
  remarks?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/UserRefDto' }] })
  createdBy: string | UserRefDto;

  @ApiProperty({ required: false, oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/UserRefDto' }] })
  updatedBy?: string | UserRefDto;

  @ApiProperty({ example: '2025-12-14T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-14T10:30:00.000Z' })
  updatedAt: Date;
}

export class StudentAttendanceListResponseDto {
  @ApiProperty({ type: [StudentAttendanceResponseDto] })
  data: StudentAttendanceResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}