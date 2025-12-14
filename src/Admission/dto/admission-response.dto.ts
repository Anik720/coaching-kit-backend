import { AdmissionStatus, AdmissionType, Gender, Religion } from "../schema/admission.schema";

export class AdmissionResponseDto {
  _id: string;
  registrationId: string;
  name: string;
  instituteName: string;
  studentGender: Gender;
  religion: Religion;
  guardianMobileNumber: string;
  admissionDate: Date;
  nameNative?: string;
  studentDateOfBirth?: Date;
  age?: number;
  presentAddress?: string;
  permanentAddress?: string;
  whatsappMobile?: string;
  studentMobileNumber?: string;
  fathersName?: string;
  mothersName?: string;
  motherMobileNumber?: string;
  admissionType: AdmissionType;
  courseFee: number;
  admissionFee: number;
  tuitionFee: number;
  referBy?: string;
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
  createdBy?: {  // <-- Add ? to make it optional
    _id: string;
    email?: string;
    username?: string;
    role?: string;
  };
  updatedBy?: {  // <-- Already optional, but confirm it has ?
    _id: string;
    email?: string;
    username?: string;
    role?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}