// attendance/dto/teacher-attendance-response.dto.ts
import { AttendanceStatus } from '../schemas/teacher-attendance.schema';

export class AttendanceDetailResponseDto {
  _id?: string;
  class: {
    _id: string;
    classname: string;
  };
  batch: {
    _id: string;
    batchName: string;
    sessionYear: string;
  };
  subject: {
    _id: string;
    subjectName: string;
    subjectCode?: string;
  };
  status: AttendanceStatus;
  remarks?: string;
}

export class UserResponseDto {
  _id: string;
  email?: string;
  username?: string;
  role?: string;
  name?: string;
}

export class TeacherResponseDto {
  _id: string;
  fullName: string;
  email: string;
  designation: string;
}

export class TeacherAttendanceResponseDto {
  _id: string;
  teacher: TeacherResponseDto; // Changed from optional to required
  date: Date;
  attendanceDetails: AttendanceDetailResponseDto[];
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  approvalStatus: string;
  submittedBy?: string;
  approvedBy?: UserResponseDto;
  approvedAt?: Date;
  approvalRemarks?: string;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}