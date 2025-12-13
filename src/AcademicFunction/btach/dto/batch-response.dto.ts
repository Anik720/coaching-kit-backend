import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class ClassResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  classname: string;
}

export class SubjectResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  subjectName: string;
}

export class GroupResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  groupName: string;
}

export class BatchResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  batchName: string;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(ClassResponse) }],
  })
  className: string | ClassResponse;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(GroupResponse) }],
  })
  group: string | GroupResponse;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(SubjectResponse) }],
  })
  subject: string | SubjectResponse;

  @ApiProperty()
  sessionYear: string;

  @ApiProperty()
  batchStartingDate: Date;

  @ApiProperty()
  batchClosingDate: Date;

  @ApiProperty()
  admissionFee: number;

  @ApiProperty()
  tuitionFee: number;

  @ApiProperty()
  courseFee: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  maxStudents: number;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(UserResponse) }],
    description: 'User who created the batch',
  })
  createdBy: string | UserResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  totalFee?: number;

  @ApiPropertyOptional()
  daysRemaining?: number;

  @ApiPropertyOptional()
  isActiveSession?: boolean;
}

export class BatchListResponseDto {
  @ApiProperty({ type: [BatchResponseDto] })
  data: BatchResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}