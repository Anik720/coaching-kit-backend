// combine-result.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombineResultController } from './combine-result.controller';
import { CombineResultService } from './combine-result.service';

// Import all model schemas
import { CombineResult, CombineResultSchema } from './combine-result.schema';
import { CombineResultStudent, CombineResultStudentSchema } from './combine-result-student.schema';
import { Exam, ExamSchema } from '../create-exam/exam.schema';
import { Student, StudentSchema } from '../../student/schemas/student.schema';
import { Result, ResultSchema } from '../result/result.schema';
import { Class, ClassSchema } from 'src/AcademicFunction/class/class.schema';
import { ExamModule } from '../create-exam/exam.module';
import { StudentModule } from 'src/student/student.module';
import { ResultModule } from '../result/result.module';
import { AcademicModule } from 'src/AcademicFunction/academic.module';
import { Batch, BatchSchema } from 'src/AcademicFunction/btach/batch.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      // Your combine result models
      { name: CombineResult.name, schema: CombineResultSchema },
      { name: CombineResultStudent.name, schema: CombineResultStudentSchema },
      // ALL other models that CombineResultService needs
      { name: Exam.name, schema: ExamSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Result.name, schema: ResultSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Batch.name, schema: BatchSchema },
    ]),
    // Keep module imports for services if needed
    ExamModule,
    StudentModule,
    ResultModule,
    AcademicModule,
  ],
  controllers: [CombineResultController],
  providers: [CombineResultService],
  exports: [CombineResultService],
})
export class CombineResultModule {}