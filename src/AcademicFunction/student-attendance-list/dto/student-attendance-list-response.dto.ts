import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class ClassResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  classname: string;
}

export class BatchResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  batchName: string;
}

export class StudentResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;
}

export class UserResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;
}

export class StudentAttendanceListResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(ClassResponse) }],
  })
  class: string | ClassResponse;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(BatchResponse) }],
  })
  batch: string | BatchResponse;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(StudentResponse) }],
  })
  student: string | StudentResponse;

  @ApiProperty()
  attendanceDate: Date;

  @ApiProperty({ enum: ['present', 'absent', 'late', 'leave', 'half_day'] })
  status: string;

  @ApiProperty({ required: false })
  vitalTherm?: number;

  @ApiProperty({ required: false })
  vitalPerm?: number;

  @ApiProperty({ required: false })
  vitalAsem?: number;

  @ApiProperty({ required: false })
  begin?: string;

  @ApiProperty({ required: false })
  remarks?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(UserResponse) }],
  })
  createdBy: string | UserResponse;

  @ApiProperty({ required: false })
  updatedBy?: string | UserResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StudentAttendanceListBulkResponseDto {
  @ApiProperty({ type: [StudentAttendanceListResponseDto] })
  data: StudentAttendanceListResponseDto[];

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [Object], required: false })
  errors?: Array<{ studentId: string; error: string }>;
}

export class StudentAttendanceListStatsDto {
  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  presentCount: number;

  @ApiProperty()
  absentCount: number;

  @ApiProperty()
  lateCount: number;

  @ApiProperty()
  leaveCount: number;

  @ApiProperty()
  halfDayCount: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty({ required: false })
  avgVitalTherm?: number;

  @ApiProperty({ required: false })
  avgVitalPerm?: number;

  @ApiProperty({ required: false })
  avgVitalAsem?: number;
}

export class StudentAttendanceListListResponseDto {
  @ApiProperty({ type: [StudentAttendanceListResponseDto] })
  data: StudentAttendanceListResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: StudentAttendanceListStatsDto, required: false })
  stats?: StudentAttendanceListStatsDto;
}