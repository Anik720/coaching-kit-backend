import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AcademicModule } from './AcademicFunction/academic.module';
import { AdmissionModule } from './Admission/admission.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';


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
     AdmissionModule,
     AuthModule,
     UsersModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
