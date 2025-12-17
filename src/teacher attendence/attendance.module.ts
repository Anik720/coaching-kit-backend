// attendance/attendance.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherAttendanceController } from './teacher-attendance.controller';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { TeacherAttendance, TeacherAttendanceSchema } from './schemas/teacher-attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherAttendance.name, schema: TeacherAttendanceSchema }
    ])
  ],
  controllers: [TeacherAttendanceController],
  providers: [TeacherAttendanceService],
  exports: [TeacherAttendanceService]
})
export class AttendanceModule {}