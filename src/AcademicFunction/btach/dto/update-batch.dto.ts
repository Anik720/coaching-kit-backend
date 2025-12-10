import { PartialType } from '@nestjs/mapped-types';
import { CreateBatchDto } from './create-batch.dto';
import {
  IsOptional,
  IsDateString,
  ValidateIf,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ValidateIf((o) => o.batchStartingDate || o.batchClosingDate)
  @IsDateString()
  @IsOptional()
  batchStartingDate?: string;

  @ValidateIf((o) => o.batchStartingDate || o.batchClosingDate)
  @IsDateString()
  @IsOptional()
  batchClosingDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Session year must be in format YYYY-YYYY',
  })
  sessionYear?: string;
}