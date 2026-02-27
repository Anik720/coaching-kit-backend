import { PartialType } from '@nestjs/swagger';
import { CreateResultDto } from './create-result.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateResultDto extends PartialType(CreateResultDto) {
  @ApiProperty({ description: 'Result class', required: false })
  @IsOptional()
  @IsString()
  resultClass?: string;

  @ApiProperty({ description: 'Remarks', required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}