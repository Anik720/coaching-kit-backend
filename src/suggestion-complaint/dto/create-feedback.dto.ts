// src/suggestion-complaint/dtos/create-feedback.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { FeedbackType } from '../enums/feedback-type.enum';
// Reuse small inline DTO in controller or define:
export class ReplyDto {
  @IsString()
  @Length(1, 2000)
  reply: string;
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  subject?: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 5000)
  message: string;

  // optional when anonymous submission
  @IsOptional()
  @IsString()
  @Length(2, 100)
  userName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 254)
  userEmail?: string;

  // client may set true to request anonymity; server will respect only if no authenticated user
  @IsOptional()
  isAnonymous?: boolean;
}

export class CreateAnonymousFeedbackDto extends CreateFeedbackDto {}
