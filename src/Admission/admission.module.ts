// admission/admission.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
import { Admission, AdmissionSchema } from './schema/admission.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admission.name, schema: AdmissionSchema }
    ])
  ],
  controllers: [AdmissionController],
  providers: [AdmissionService],
  exports: [AdmissionService]
})
export class AdmissionModule {}