// admission/dto/create-admission.dto.ts

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AdmissionType, Gender, Religion } from '../schema/admission.schema';


export class BatchSubjectDto {
  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsNumber()
  subjectId?: number;
}

export class BatchDto {
  @IsOptional()
  @IsString()
  batchName?: string;

  @IsOptional()
  @IsNumber()
  batchId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSubjectDto)
  subjects?: BatchSubjectDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  admissionFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tuitionFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  courseFee?: number;
}

export class CreateAdmissionDto {
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  registrationId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameNative?: string;

  @IsEnum(Gender)
  studentGender: Gender;

  @IsDateString()
  studentDateOfBirth: string;

  @IsString()
  @MinLength(5)
  presentAddress: string;

  @IsString()
  @MinLength(5)
  permanentAddress: string;

  @IsEnum(Religion)
  religion: Religion;

  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  whatsappMobile: string;

  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  studentMobileNumber: string;

  @IsString()
  @MinLength(2)
  instituteName: string;

  @IsString()
  @MinLength(2)
  fathersName: string;

  @IsString()
  @MinLength(2)
  mothersName: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  guardianMobileNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  motherMobileNumber?: string;

  @IsEnum(AdmissionType)
  admissionType: AdmissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  courseFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  admissionFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tuitionFee?: number;

  @IsOptional()
  @IsString()
  referBy?: string;

  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  batch_with_subjects?: any;
}