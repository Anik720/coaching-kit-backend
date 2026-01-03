// teacher/dto/create-teacher.dto.ts
import { 
  IsString, IsEnum, IsDate, IsNumber, IsOptional, 
  Min, Matches, IsBoolean, IsEmail, IsNotEmpty, 
  MinLength, ValidateIf 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, Religion, BloodGroup, Designation, AssignType } from '../schemas/teacher.schema';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;

  @IsString()
  @Matches(/^\d{11}$/)
  @IsNotEmpty()
  contactNumber: string;

  @IsString()
  @Matches(/^\d{11}$/)
  @IsNotEmpty()
  emergencyContactNumber: string;

  @IsString()
  @IsNotEmpty()
  presentAddress: string;

  @IsString()
  @IsNotEmpty()
  permanentAddress: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/)
  whatsappNumber?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsEmail()
  secondaryEmail?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsEnum(Designation)
  @IsNotEmpty()
  designation: Designation;

  @IsEnum(AssignType)
  @IsNotEmpty()
  assignType: AssignType;

  @ValidateIf(o => o.assignType === AssignType.MONTHLY_BASIS || o.assignType === AssignType.BOTH)
  @IsNumber()
  @Min(0)
  monthlyTotalClass?: number;

  @ValidateIf(o => o.assignType === AssignType.MONTHLY_BASIS || o.assignType === AssignType.BOTH)
  @IsNumber()
  @Min(0)
  salary?: number;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  joiningDate: Date;

  @IsOptional()
  @IsString()
  remarks?: string;
}