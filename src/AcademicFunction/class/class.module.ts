// src/class/class.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './class.schema';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { BatchModule } from '../btach/batch.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Class.name, schema: ClassSchema }]),
    BatchModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [MongooseModule, ClassService], // Add MongooseModule to exports!
})
export class ClassModule {}