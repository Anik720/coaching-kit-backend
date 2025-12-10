// src/suggestion-complaint/schemas/feedback.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FeedbackType } from '../enums/feedback-type.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ trim: true })
  userName?: string;

  @Prop({ trim: true })
  userEmail?: string;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ type: String, enum: Object.values(FeedbackType), required: true })
  type: FeedbackType;

  @Prop({ trim: true, maxlength: 200, default: '' })
  subject?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: Object.values(FeedbackStatus), default: FeedbackStatus.PENDING, index: true })
  status: FeedbackStatus;

  @Prop({ default: true })
  isActive: boolean;

  // admin replies array
  @Prop({ type: [{ authorId: Types.ObjectId, authorName: String, message: String, createdAt: Date }] })
  reply?: Array<{
    authorId?: Types.ObjectId;
    authorName?: string;
    message: string;
    createdAt: Date;
  }>;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Indexes for search & performance
FeedbackSchema.index({ type: 1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ user: 1 });
FeedbackSchema.index({ subject: 'text', message: 'text' });
