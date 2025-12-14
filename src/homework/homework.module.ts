import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import { Homework, HomeworkSchema } from './homework.schema';
import { Class, ClassSchema } from 'src/AcademicFunction/class/class.schema';
import { Subject, SubjectSchema } from 'src/AcademicFunction/subject/subject.schema';
import { Batch, BatchSchema } from 'src/AcademicFunction/btach/batch.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}