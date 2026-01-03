// attendance/dto/approve-attendance.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveAttendanceDto {
  @IsEnum(['approved', 'rejected'])
  approvalStatus: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  remarks?: string;
}