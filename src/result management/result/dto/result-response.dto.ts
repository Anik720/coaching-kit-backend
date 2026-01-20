import { Types } from 'mongoose';

export class ExamInfoDto {
  _id: string;
  examName: string;
  totalMarks: number;
  totalPassMarks?: number;
  enableGrading: boolean;
  useGPASystem: boolean;
}

export class StudentInfoDto {
  _id: string;
  registrationId: string;
  nameEnglish: string;
  class: string;
  batch: string;
}

export class ClassInfoDto {
  _id: string;
  classname: string;
}

export class BatchInfoDto {
  _id: string;
  batchName: string;
  sessionYear: string;
}

export class UserInfoDto {
  _id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
}

export class SubjectMarkDto {
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
}

export class ResultResponseDto {
  _id: string;
  exam: ExamInfoDto;
  student: StudentInfoDto;
  class: ClassInfoDto;
  batch: BatchInfoDto;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string;
  gpa?: number;
  position: number;
  isPassed: boolean;
  isAbsent: boolean;
  resultClass?: string;
  remarks?: string;
  subjectWiseMarks?: SubjectMarkDto[];
  createdBy: UserInfoDto;
  updatedBy?: UserInfoDto;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}