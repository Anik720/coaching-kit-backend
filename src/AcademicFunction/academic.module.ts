import { ClassModule } from './class/class.module';
import { SubjectModule } from './subject/subject.module';
import { GroupModule } from './group/group.module';
import { BatchModule } from './btach/batch.module';
import { StudentAttendanceModule } from './student-attendance/student-attendance.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ClassModule,
    SubjectModule,
    GroupModule,
    BatchModule,
    StudentAttendanceModule,
  ],
})
export class AcademicModule {}