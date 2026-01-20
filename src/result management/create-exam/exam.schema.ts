// src/result-management/exam/schemas/exam.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MarksField {
  @Prop({ required: true })
  type: string; // 'mcq', 'cq', 'written'

  @Prop({ required: true, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  enablePassMarks: boolean;

  @Prop({ min: 0, default: null })
  passMarks?: number;

  @Prop({ default: false })
  enableNegativeMarking: boolean;

  @Prop({ min: 0, default: null })
  negativeMarks?: number;
}

@Schema({ timestamps: true })
export class Exam {
  @Prop({ required: true })
  examName: string;

  @Prop({ required: true })
  topicName: string;

  @Prop({ required: true })
  className: string;

  @Prop({ required: true })
  batchName: string;

  @Prop({ required: true })
  subjectName: string;

  @Prop({ required: true })
  examCategory: string;

  @Prop({ required: true })
  examDate: Date;

  @Prop({ default: false })
  showMarksTitle: boolean;

  @Prop({ type: [MarksField], default: [] })
  marksFields: MarksField[];

  @Prop({ required: true, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  enableGrading: boolean;

  @Prop({ min: 0, default: null })
  totalPassMarks?: number;

  @Prop({ default: false })
  showPercentageInResult: boolean;

  @Prop({ default: false })
  showGPAInResult: boolean;

  @Prop({ default: false })
  useGPASystem: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const MarksFieldSchema = SchemaFactory.createForClass(MarksField);
export const ExamSchema = SchemaFactory.createForClass(Exam);

export type ExamDocument = Exam & Document;

// Create indexes
ExamSchema.index({ examName: 1, className: 1, subjectName: 1 }, { unique: true });
ExamSchema.index({ examDate: 1 });
ExamSchema.index({ className: 1 });
ExamSchema.index({ subjectName: 1 });
ExamSchema.index({ examCategory: 1 });
ExamSchema.index({ isActive: 1 });