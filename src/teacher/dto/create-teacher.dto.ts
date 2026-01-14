import { 
  IsString, IsEnum, IsDate, IsNumber, IsOptional, 
  Min, Matches, IsBoolean, IsNotEmpty, IsEmail,
  MinLength, MaxLength, IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  Gender, 
  Religion, 
  BloodGroup, 
  Designation, 
  AssignType, 
  TeacherStatus 
} from '../schemas/teacher.schema';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fatherName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  motherName: string;

  @IsEnum(Religion)
  @IsNotEmpty()
  religion: Religion;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[3-9]\d{8}$/, { 
    message: 'Contact number must be a valid Bangladeshi number (11 digits starting with 01)' 
  })
  contactNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[3-9]\d{8}$/, { 
    message: 'Emergency contact number must be a valid Bangladeshi number (11 digits starting with 01)' 
  })
  emergencyContactNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  presentAddress: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  permanentAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[3-9]\d{8}$/, { 
    message: 'WhatsApp number must be a valid Bangladeshi number (11 digits starting with 01)' 
  })
  whatsappNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,17}$/, { 
    message: 'National ID must be 10-17 digits' 
  })
  nationalId: string;

  @IsEnum(BloodGroup)
  @IsNotEmpty()
  bloodGroup: BloodGroup;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  // System Access
  @IsEmail()
  @IsNotEmpty()
  systemEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  // Job Information
  @IsEnum(Designation)
  @IsNotEmpty()
  designation: Designation;

  @IsEnum(AssignType)
  @IsNotEmpty()
  assignType: AssignType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTotalClass?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsDateString()
  @IsNotEmpty()
  joiningDate: string;

  @IsEnum(TeacherStatus)
  @IsOptional()
  status?: TeacherStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}