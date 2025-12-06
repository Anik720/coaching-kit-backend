// student/student.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student, StudentSchema } from './schemas/student.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema }
    ])
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule {}