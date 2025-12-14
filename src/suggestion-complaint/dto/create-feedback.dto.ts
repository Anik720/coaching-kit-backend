import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, IsBoolean } from 'class-validator';
import { FeedbackType } from '../enums/feedback-type.enum';

export class ReplyDto {
  @IsString()
  @Length(1, 2000)
  reply: string;
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  @IsNotEmpty()
  type: FeedbackType;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  subject?: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 5000)
  message: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  userName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 254)
  userEmail?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateAnonymousFeedbackDto extends CreateFeedbackDto {}