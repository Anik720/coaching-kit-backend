import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamCategory, ExamCategorySchema } from './exam-category.schema';
import { ExamCategoryController } from './exam-category.controller';
import { ExamCategoryService } from './exam-category.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamCategory.name, schema: ExamCategorySchema }
    ]),
  ],
  controllers: [ExamCategoryController],
  providers: [ExamCategoryService],
  exports: [ExamCategoryService],
})
export class ExamCategoryModule {}