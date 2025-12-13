import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { Batch, BatchSchema } from './batch.schema';
import { Class, ClassSchema } from '../class/class.schema';
import { Subject, SubjectSchema } from '../subject/subject.schema';
import { Group, GroupSchema } from '../group/group.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Batch.name, schema: BatchSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Group.name, schema: GroupSchema },
       { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}