// src/result-management/exam/schemas/exam.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Removed complex MarkTitle and Grade classes
// Using simpler approach with predefined marks fields

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

  @Prop({ type: [String], default: [] })
  selectedMarksFields: string[]; // ['mcq', 'cq', 'written']

  @Prop({ required: true, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  enableGrading: boolean;

  @Prop({ min: 0, default: null })
  passMarks?: number; // Changed from passMarksPercentage

  @Prop({ default: false })
  showPercentageInResult: boolean;

  @Prop({ default: false })
  showGPAInResult: boolean;

  @Prop({ default: false })
  useGPASystem: boolean;

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