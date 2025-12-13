import { 
  IsString, IsEnum, IsDate, IsNumber, IsOptional, 
  Min, Matches, IsBoolean, IsMongoId, IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, Religion, AdmissionType } from '../schemas/student.schema';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsMongoId()
  @IsNotEmpty()
  class: string;

  @IsMongoId()
  @IsNotEmpty()
  batch: string;

  @IsString()
  @IsNotEmpty()
  nameEnglish: string;

  @IsOptional()
  @IsString()
  subunitCategory?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @IsOptional()
  @Matches(/^\d{10,15}$/)
  studentMobileNumber?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  wardNumber?: string;

  @IsString()
  @IsNotEmpty()
  presentAddress: string;

  @IsString()
  @IsNotEmpty()
  permanentAddress: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsString()
  @IsNotEmpty()
  fatherName: string;

  @Matches(/^\d{10,15}$/)
  @IsNotEmpty()
  fatherMobileNumber: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @Matches(/^\d{10,15}$/)
  motherMobileNumber?: string;

  @IsEnum(AdmissionType)
  @IsNotEmpty()
  admissionType: AdmissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  admissionFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTuitionFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  courseFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  admissionDate?: Date;

  @IsOptional()
  @IsString()
  remarks?: string;
}