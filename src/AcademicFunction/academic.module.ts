import { Module } from '@nestjs/common';
import { ClassModule } from './class/class.module';
import { SubjectModule } from './subject/subject.module';

@Module({
  imports: [ClassModule,
    SubjectModule
  ],
})
export class AcademicModule {}
