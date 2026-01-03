import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentAttendanceListController } from './student-attendance-list.controller';
import { StudentAttendanceListService } from './student-attendance-list.service';
import {
  StudentAttendanceList,
  StudentAttendanceListSchema,
} from './entities/student-attendance-list.schema';
import { Class, ClassSchema } from '../class/class.schema';

import { User, UserSchema } from '../../users/schemas/user.schema';
import { Batch, BatchSchema } from '../btach/batch.schema';
import { Student, StudentSchema } from 'src/student/schemas/student.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentAttendanceList.name, schema: StudentAttendanceListSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: User.name, schema: UserSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [StudentAttendanceListController],
  providers: [StudentAttendanceListService],
  exports: [StudentAttendanceListService],
})
export class StudentAttendanceListModule {}