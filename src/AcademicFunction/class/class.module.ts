import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './class.schema';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Class.name, schema: ClassSchema }]),
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService], // for reuse in future submodules if needed
})
export class ClassModule {}
