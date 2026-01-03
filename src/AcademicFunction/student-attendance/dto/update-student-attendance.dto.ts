import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentAttendanceDto } from './create-student-attendance.dto';

export class UpdateStudentAttendanceDto extends PartialType(CreateStudentAttendanceDto) {}