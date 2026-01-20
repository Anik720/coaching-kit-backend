import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { Result, ResultSchema } from './result.schema';
import { Exam, ExamSchema } from '../create-exam/exam.schema';
import { Student, StudentSchema } from 'src/student/schemas/student.schema';



@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [ResultService],
})
export class ResultModule {}