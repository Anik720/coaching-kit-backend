import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema } from './exam.schema';
import { ClassModule } from 'src/AcademicFunction/class/class.module';
import { BatchModule } from 'src/AcademicFunction/btach/batch.module';
import { SubjectModule } from 'src/AcademicFunction/subject/subject.module';
import { ExamCategoryModule } from '../exam category/exam-category.module';
import { ExamController } from './create-exam.controller';
import { ExamService } from './exam.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema }
    ]),
    ClassModule,
    BatchModule,
    SubjectModule,
    ExamCategoryModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}