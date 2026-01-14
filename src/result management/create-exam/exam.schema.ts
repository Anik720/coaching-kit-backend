import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class MarkTitle {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  marks: number;

  @Prop({ min: 0, default: null })
  passMarks?: number;
}

class Grade {
  @Prop({ required: true })
  grade: string;

  @Prop({ default: null })
  description?: string;

  @Prop({ required: true, min: 0, max: 100 })
  minPercentage: number;

  @Prop({ required: true, min: 0, max: 100 })
  maxPercentage: number;
}

export type ExamDocument = Exam & Document;

@Schema({ timestamps: true })
export class Exam {
  @Prop({ required: true })
  examName: string;

  @Prop({ required: true })
  topicName: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  class: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Batch' }], required: true })
  batches: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subject: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExamCategory', required: true })
  examCategory: Types.ObjectId;

  @Prop({ required: true })
  examDate: Date;

  @Prop({ default: false })
  showMarksTitle: boolean;

  @Prop({ type: [MarkTitle], default: [] })
  markTitles: MarkTitle[];

  @Prop({ required: true, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  enableGrading: boolean;

  @Prop({ min: 0, max: 100, default: null })
  passMarksPercentage?: number;

  @Prop({ type: [Grade], default: [] })
  grades: Grade[];

  @Prop({ default: null })
  instructions?: string;

  @Prop({ min: 1, default: null })
  duration?: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Create indexes
ExamSchema.index({ examName: 1, class: 1, subject: 1 }, { unique: true });
ExamSchema.index({ examDate: 1 });
ExamSchema.index({ class: 1 });
ExamSchema.index({ subject: 1 });
ExamSchema.index({ examCategory: 1 });
ExamSchema.index({ isActive: 1 });