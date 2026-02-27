import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombineResultController } from './combine-result.controller';
import { CombineResultService } from './combine-result.service';

// Import all model schemas
import { CombineResult, CombineResultSchema } from './combine-result.schema';
 // Add this import
import { Exam, ExamSchema } from '../create-exam/exam.schema';
import { Student, StudentSchema } from '../../student/schemas/student.schema';
import { Result, ResultSchema } from '../result/result.schema';
import { Class, ClassSchema } from 'src/AcademicFunction/class/class.schema';
import { Batch, BatchSchema } from 'src/AcademicFunction/btach/batch.schema';
import { ExamCategory, ExamCategorySchema } from '../exam category/exam-category.schema';
import { CombineResultStudent, CombineResultStudentSchema } from './combine-result-student.schema';


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
      { name: ExamCategory.name, schema: ExamCategorySchema },
    ]),
  ],
  controllers: [CombineResultController],
  providers: [CombineResultService],
  exports: [CombineResultService],
})
export class CombineResultModule {}