import { Module } from '@nestjs/common';
import { ClassModule } from './class/class.module';
import { SubjectModule } from './subject/subject.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [ClassModule,
    SubjectModule,
    GroupModule
  ],
})
export class AcademicModule {}
