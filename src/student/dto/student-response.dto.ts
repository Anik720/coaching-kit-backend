import { Gender, Religion, AdmissionType } from '../schemas/student.schema';

export class ClassResponseDto {
  _id: string;
  classname: string;
}

export class BatchResponseDto {
  _id: string;
  batchName: string;
  sessionYear: string;
  batchStartingDate: Date;
  batchClosingDate: Date;
}

export class UserResponseDto {
  _id: string;
  email?: string;
  username?: string;
  role?: string;
  name?: string;
}

export class StudentResponseDto {
  _id: string;
  registrationId: string;
  class?: ClassResponseDto;
  batch?: BatchResponseDto;
  nameEnglish: string;
  subunitCategory?: string;
  dateOfBirth: Date;
  gender: Gender;
  religion: Religion;
  studentMobileNumber?: string;
  wardNumber?: string;
  presentAddress: string;
  permanentAddress: string;
  photoUrl?: string;
  fatherName: string;
  fatherMobileNumber: string;
  motherName?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  admissionFee: number;
  monthlyTuitionFee: number;
  courseFee: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  admissionDate: Date;
  nextPaymentDate?: Date;
  referredBy?: string;
  status: string;
  isActive: boolean;
  remarks?: string;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}