import { FeedbackType } from '../enums/feedback-type.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';

export class UserInfoDto {
  _id: string;
  email?: string;
  username?: string;
  name?: string;
  role?: string;
}

export class ReplyResponseDto {
  authorId?: string;
  authorName?: string;
  message: string;
  createdAt: Date;
  author?: UserInfoDto;
}

export class FeedbackResponseDto {
  _id: string;
  user?: UserInfoDto;
  userName?: string;
  userEmail?: string;
  isAnonymous: boolean;
  type: FeedbackType;
  subject?: string;
  message: string;
  status: FeedbackStatus;
  isActive: boolean;
  reply?: ReplyResponseDto[];
  createdBy?: UserInfoDto;
  updatedBy?: UserInfoDto;
  createdAt: Date;
  updatedAt: Date;
}