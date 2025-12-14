import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

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

export class BatchResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  batchName: string;
}

export class UserResponse {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;
}

export class HomeworkResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  homeworkName: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(ClassResponse) }],
  })
  class: string | ClassResponse;

  @ApiProperty({
    type: () => [Object],
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'array', items: { $ref: getSchemaPath(BatchResponse) } },
    ],
  })
  batches: string[] | BatchResponse[];

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(SubjectResponse) }],
  })
  subject: string | SubjectResponse;

  @ApiProperty()
  homeworkDate: Date;

  @ApiProperty({
    type: () => Object,
    oneOf: [{ type: 'string' }, { $ref: getSchemaPath(UserResponse) }],
  })
  createdBy: string | UserResponse;

  @ApiProperty({ required: false })
  updatedBy?: string | UserResponse;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class HomeworkListResponseDto {
  @ApiProperty({ type: [HomeworkResponseDto] })
  data: HomeworkResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}