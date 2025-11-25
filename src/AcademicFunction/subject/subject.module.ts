import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from './subject.schema';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }])],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService], // exported for reuse in other modules
})
export class SubjectModule {}
