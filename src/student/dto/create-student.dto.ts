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
  class: string;

  @IsMongoId()
  batch: string;

  @IsString()
  nameEnglish: string;

  @IsOptional()
  @IsString()
  subunitCategory?: string;

  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @IsEnum(Gender)
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
  presentAddress: string;

  @IsString()
  permanentAddress: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsString()
  fatherName: string;

  @Matches(/^\d{10,15}$/)
  fatherMobileNumber: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @Matches(/^\d{10,15}$/)
  motherMobileNumber?: string;

  @IsEnum(AdmissionType)
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