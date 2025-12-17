// attendance/dto/create-teacher-attendance.dto.ts
import { 
  IsString, IsEnum, IsDate, IsNumber, IsOptional, 
  IsArray, IsNotEmpty, IsMongoId, ArrayMinSize, 
  ValidateNested, IsDefined 
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../schemas/teacher-attendance.schema';

export class AttendanceDetailDto {
  @IsMongoId()
  @IsNotEmpty()
  class: string;

  @IsMongoId()
  @IsNotEmpty()
  batch: string;

  @IsMongoId()
  @IsNotEmpty()
  subject: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateTeacherAttendanceDto {
  @IsMongoId()
  @IsNotEmpty()
  teacher: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceDetailDto)
  @IsDefined()
  attendanceDetails: AttendanceDetailDto[];

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  approvalRemarks?: string;
}