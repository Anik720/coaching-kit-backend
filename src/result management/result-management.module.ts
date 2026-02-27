
import { Module } from '@nestjs/common';
import { ExamCategoryModule } from './exam category/exam-category.module';
import { ExamModule } from './create-exam/exam.module';
import { ResultModule } from './result/result.module';
import { CombineResultModule } from './combine-result/combine-result.module';

@Module({
  imports: [
    ExamCategoryModule,
    ExamModule,
    ResultModule,
    CombineResultModule
  ],
})
export class ResultManagementModule {}