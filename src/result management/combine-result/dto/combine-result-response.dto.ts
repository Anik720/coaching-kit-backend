// dto/combine-result-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CombineResultResponseDto {
  @ApiProperty({ example: '67f1f77bcf86cd799439031' })
  _id: string;

  @ApiProperty({ example: 'HSC 2027 Combined Result' })
  name: string;

  @ApiProperty({ 
    example: { _id: '67f1f77bcf86cd799439011', classname: 'HSC 2027' }
  })
  class: {
    _id: string;
    classname: string;
  };

  @ApiProperty({
    example: [
      { _id: '67f1f77bcf86cd799439012', batchName: 'SAT-2PM', sessionYear: '2024-2025' },
      { _id: '67f1f77bcf86cd799439013', batchName: 'SUN-3PM', sessionYear: '2024-2025' }
    ]
  })
  batches: Array<{
    _id: string;
    batchName: string;
    sessionYear: string;
  }>;

  @ApiProperty({
    example: [
      { 
        _id: '67f1f77bcf86cd799439021', 
        examName: 'Class Test -29', 
        totalMarks: 30,
        mcqMarks: 0,
        cqMarks: 0,
        writtenMarks: 30,
        category: 'class_test'
      },
      { 
        _id: '67f1f77bcf86cd799439022', 
        examName: 'Class Test -30', 
        totalMarks: 30,
        mcqMarks: 0,
        cqMarks: 0,
        writtenMarks: 30,
        category: 'class_test'
      }
    ]
  })
  exams: Array<{
    _id: string;
    examName: string;
    totalMarks: number;
    mcqMarks: number;
    cqMarks: number;
    writtenMarks: number;
    category: string;
  }>;

  @ApiProperty({ example: 'class_test' })
  category: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-01-31T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({ example: 60 })
  totalMarks: number;

  @ApiProperty({ example: 0 })
  mcqMarks: number;

  @ApiProperty({ example: 60 })
  cqMarks: number;

  @ApiProperty({ example: 0 })
  writtenMarks: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiProperty({
    example: { 
      _id: '67f1f77bcf86cd799439041', 
      email: 'admin@example.com', 
      username: 'admin',
      role: 'admin'
    }
  })
  createdBy: {
    _id: string;
    email: string;
    username: string;
    role: string;
  };

  @ApiProperty({ example: null, required: false })
  updatedBy?: {
    _id: string;
    email: string;
    username: string;
    role: string;
  } | null;

//   @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
//   createdAt: Date;

//   @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
//   updatedAt: Date;
}

export class CombineResultStudentResponseDto {
  @ApiProperty({ example: '67f1f77bcf86cd799439051' })
  _id: string;

  @ApiProperty({ example: '67f1f77bcf86cd799439031' })
  combineResultId: string;

  @ApiProperty({
    example: {
      _id: '67f1f77bcf86cd799439061',
      registrationId: 'STU001',
      nameEnglish: 'Tasfa Haque',
      nameBangla: 'তাসফা হক'
    }
  })
  student: {
    _id: string;
    registrationId: string;
    nameEnglish: string;
    nameBangla?: string;
  };

  @ApiProperty({
    example: { _id: '67f1f77bcf86cd799439012', batchName: 'SAT-2PM' }
  })
  batch: {
    _id: string;
    batchName: string;
  };

  @ApiProperty({
    example: {
      '67f1f77bcf86cd799439021': { obtainedMarks: 27, totalMarks: 30, isAbsent: false },
      '67f1f77bcf86cd799439022': { obtainedMarks: 25, totalMarks: 30, isAbsent: false }
    }
  })
  examMarks: Record<string, {
    obtainedMarks: number;
    totalMarks: number;
    isAbsent: boolean;
  }>;

  @ApiProperty({ example: 60 })
  totalMarks: number;

  @ApiProperty({ example: 52 })
  obtainedMarks: number;

  @ApiProperty({ example: 86.67 })
  percentage: number;

  @ApiProperty({ example: 'A' })
  grade: string;

  @ApiProperty({ example: 4.0 })
  gpa: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: true })
  isPassed: boolean;

  @ApiProperty({ example: false })
  isAbsent: boolean;

  @ApiProperty({ example: 'first_class' })
  resultClass: string;

//   @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
//   createdAt: Date;

//   @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
//   updatedAt: Date;
}