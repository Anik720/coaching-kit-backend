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
  IsNotEmpty,
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
  @IsNotEmpty()
  @MaxLength(50)
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  instituteName: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  studentGender: Gender;

  @IsEnum(Religion)
  @IsNotEmpty()
  religion: Religion;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  guardianMobileNumber: string;

  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameNative?: string;

  @IsOptional()
  @IsDateString()
  studentDateOfBirth?: string;

  @IsOptional()
  @IsString()
  presentAddress?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  whatsappMobile?: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  studentMobileNumber?: string;

  @IsOptional()
  @IsString()
  fathersName?: string;

  @IsOptional()
  @IsString()
  mothersName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladeshi mobile number',
  })
  motherMobileNumber?: string;

  @IsOptional()
  @IsEnum(AdmissionType)
  admissionType?: AdmissionType;

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