import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';
import { Result, ResultSchema } from './result.schema';
import { Exam, ExamSchema } from '../create-exam/exam.schema';
import { Student, StudentSchema } from '../../student/schemas/student.schema';
import { Subject, SubjectSchema } from 'src/AcademicFunction/subject/subject.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
  ],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [MongooseModule, ResultService], // Export MongooseModule!
})
export class ResultModule {}