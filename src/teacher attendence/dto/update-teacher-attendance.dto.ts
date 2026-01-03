// attendance/dto/update-teacher-attendance.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherAttendanceDto } from './create-teacher-attendance.dto';

export class UpdateTeacherAttendanceDto extends PartialType(CreateTeacherAttendanceDto) {}