import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AcademicModule } from './AcademicFunction/academic.module';
import { StudentModule } from './student/student.module';
import { AdmissionModule } from './Admission/admission.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { SuggestionComplaintModule } from './suggestion-complaint/suggestion-complaint.module';
import { TeacherModule } from './teacher/teacher.module';
import { AttendanceModule } from './teacher attendence/attendance.module';
import { InstituteModule } from './institute/institute.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

     AcademicModule,
     StudentModule,
     AdmissionModule,
     AuthModule,
     UsersModule,
     SuggestionComplaintModule,
     TeacherModule,
     AttendanceModule,
     InstituteModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
