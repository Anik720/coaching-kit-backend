
import { Module } from '@nestjs/common';
import { ExamCategoryModule } from './exam category/exam-category.module';
import { ExamModule } from './create-exam/exam.module';

@Module({
  imports: [
    ExamCategoryModule,
    ExamModule
  ],
})
export class ResultManagementModule {}