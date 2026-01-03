import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentAttendance, StudentAttendanceSchema } from './student-attendance.schema';
import { StudentAttendanceController } from './student-attendance.controller';
import { StudentAttendanceService } from './student-attendance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentAttendance.name, schema: StudentAttendanceSchema },
    ]),
  ],
  controllers: [StudentAttendanceController],
  providers: [StudentAttendanceService],
  exports: [StudentAttendanceService],
})
export class StudentAttendanceModule {}