// combine-result.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombineResultController } from './combine-result.controller';
import { CombineResultService } from './combine-result.service';


import { StudentModule } from '../../student/student.module';
import { ResultModule } from '../result/result.module';
import { CombineResult, CombineResultSchema } from './combine-result.schema';
import { CombineResultStudent, CombineResultStudentSchema } from './combine-result-student.schema';
import { ExamModule } from '../create-exam/exam.module';
import { AcademicModule } from 'src/AcademicFunction/academic.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CombineResult.name, schema: CombineResultSchema },
      { name: CombineResultStudent.name, schema: CombineResultStudentSchema },
    ]),
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