// src/suggestion-complaint/dtos/update-feedback.dto.ts
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { FeedbackStatus } from '../enums/feedback-status.enum';

export class UpdateFeedbackDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  subject?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  message?: string;
}

export class AdminUpdateFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  subject?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  message?: string;
}
