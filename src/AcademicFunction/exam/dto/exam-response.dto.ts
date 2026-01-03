import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ExamCategory, ExamStatus } from '../exam.schema';


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

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;
}

export class MarksDistributionResponse {
  @ApiProperty()
  type: string;

  @ApiProperty()
  marks: number;
}

export class GradingSystemResponse {
  @ApiProperty()
  grade: string;

  @ApiProperty()
  minMarks: number;

  @ApiProperty()
  maxMarks: number;

  @ApiProperty()
  points: number;
}

export class ExamResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  examName: string;

  @ApiProperty({ type: () => Object, oneOf: [
    { type: 'string' },
    { $ref: getSchemaPath(ClassResponse) }
  ]})
  class: string | ClassResponse;

  @ApiProperty({ type: () => Object, oneOf: [
    { type: 'string' },
    { $ref: getSchemaPath(SubjectResponse) }
  ]})
  subject: string | SubjectResponse;

  @ApiProperty({ type: () => Object, oneOf: [
    { type: 'array', items: { type: 'string' } },
    { type: 'array', items: { $ref: getSchemaPath(BatchResponse) } }
  ]})
  batches: string[] | BatchResponse[];

  @ApiProperty({ enum: ExamCategory })
  category: ExamCategory;

  @ApiProperty()
  examDate: Date;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  showMarksInResult: boolean;

  @ApiPropertyOptional({ type: [MarksDistributionResponse] })
  marksDistribution?: MarksDistributionResponse[];

  @ApiProperty()
  totalMarks: number;

  @ApiProperty()
  enableGrading: boolean;

  @ApiPropertyOptional({ type: [GradingSystemResponse] })
  gradingSystem?: GradingSystemResponse[];

  @ApiProperty()
  passMarks: number;

  @ApiProperty({ enum: ExamStatus })
  status: ExamStatus;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty({ type: () => Object, oneOf: [
    { type: 'string' },
    { $ref: getSchemaPath(UserResponse) }
  ]})
  createdBy: string | UserResponse;

  @ApiPropertyOptional({ type: () => Object, oneOf: [
    { type: 'string' },
    { $ref: getSchemaPath(UserResponse) }
  ]})
  updatedBy?: string | UserResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  durationInMinutes?: number;

  @ApiPropertyOptional()
  daysRemaining?: number;

  @ApiPropertyOptional()
  isUpcoming?: boolean;

  @ApiPropertyOptional()
  isOngoing?: boolean;

  @ApiPropertyOptional()
  isCompleted?: boolean;
}

export class ExamListResponseDto {
  @ApiProperty({ type: [ExamResponseDto] })
  data: ExamResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}