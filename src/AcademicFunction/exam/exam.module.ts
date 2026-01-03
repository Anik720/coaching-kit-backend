import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

import { Class, ClassSchema } from '../class/class.schema';
import { Subject, SubjectSchema } from '../subject/subject.schema';

import { User, UserSchema } from '../../users/schemas/user.schema';
import { Exam, ExamSchema } from './exam.schema';
import { Batch, BatchSchema } from '../btach/batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}