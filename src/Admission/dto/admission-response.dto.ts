// admission/dto/admission-response.dto.ts

import { AdmissionStatus, AdmissionType, Gender, Religion } from "../schema/admission.schema";


export class AdmissionResponseDto {
  registrationId: string;
  name: string;
  nameNative?: string;
  studentGender: Gender;
  studentDateOfBirth: Date;
  age: number;
  presentAddress: string;
  permanentAddress: string;
  religion: Religion;
  whatsappMobile: string;
  studentMobileNumber: string;
  instituteName: string;
  fathersName: string;
  mothersName: string;
  guardianMobileNumber?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  courseFee: number;
  admissionFee: number;
  tuitionFee: number;
  referBy?: string;
  admissionDate: Date;
  batches: any[];
  status: AdmissionStatus;
  isCompleted: boolean;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  photoUrl?: string;
  remarks?: string;
  completedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}