import { PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto';
import { IsOptional, IsDateString, ValidateIf } from 'class-validator';

export class UpdateExamDto extends PartialType(CreateExamDto) {
  @ValidateIf((o) => o.startTime || o.endTime)
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ValidateIf((o) => o.startTime || o.endTime)
  @IsDateString()
  @IsOptional()
  endTime?: string;
}