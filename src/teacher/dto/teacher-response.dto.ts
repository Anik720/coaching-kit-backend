// teacher/dto/teacher-response.dto.ts
import { Gender, Religion, BloodGroup, Designation, AssignType } from '../schemas/teacher.schema';

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
  fatherName?: string;
  motherName?: string;
  religion: Religion;
  gender: Gender;
  dateOfBirth: Date;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber?: string;
  email: string;
  secondaryEmail?: string;
  nationalId?: string;
  bloodGroup?: BloodGroup;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  designation: Designation;
  assignType: AssignType;
  monthlyTotalClass?: number;
  salary?: number;
  joiningDate: Date;
  status: string;
  isActive: boolean;
  remarks?: string;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}