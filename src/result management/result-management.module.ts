
import { Module } from '@nestjs/common';
import { ExamCategoryModule } from './exam category/exam-category.module';

@Module({
  imports: [
    ExamCategoryModule
  ],
})
export class ResultManagementModule {}