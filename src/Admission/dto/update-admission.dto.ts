import { PartialType } from '@nestjs/mapped-types';
import { CreateAdmissionDto } from './create-admission.dto';
import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { AdmissionStatus } from '../schema/admission.schema';

export class UpdateAdmissionDto extends PartialType(CreateAdmissionDto) {
  @IsOptional()
  @IsEnum(AdmissionStatus)
  status?: AdmissionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  photoPath?: string;
}