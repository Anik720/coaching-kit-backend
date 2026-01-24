// src/result-management/exam/schemas/exam.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamDocument = Exam & Document;

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

  @Prop({ type: [{ 
    type: { type: String, enum: ['mcq', 'cq', 'written'] },
    totalMarks: { type: Number, min: 0 },
    enablePassMarks: { type: Boolean, default: false },
    passMarks: { type: Number, min: 0, default: null },
    enableNegativeMarking: { type: Boolean, default: false },
    negativeMarks: { type: Number, min: 0, default: null }
  }], default: [] })
  marksFields: Array<{
    type: 'mcq' | 'cq' | 'written';
    totalMarks: number;
    enablePassMarks: boolean;
    passMarks?: number;
    enableNegativeMarking: boolean;
    negativeMarks?: number;
  }>;

  @Prop({ required: true, min: 0 })
  totalMarks: number;

  // Calculate these from marksFields for easy access
  @Prop({ min: 0, default: 0 })
  mcqMarks: number;

  @Prop({ min: 0, default: 0 })
  cqMarks: number;

  @Prop({ min: 0, default: 0 })
  writtenMarks: number;

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

  @Prop({ default: false })
  isPublished: boolean;

  // Add class and batch references as ObjectIds
  @Prop({ type: Types.ObjectId, ref: 'Class' })
  class?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Batch' })
  batch?: Types.ObjectId;

  // Virtual populate
  classDetails?: any;
  batchDetails?: any;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Create indexes
ExamSchema.index({ examName: 1, className: 1, subjectName: 1 }, { unique: true });
ExamSchema.index({ examDate: 1 });
ExamSchema.index({ className: 1 });
ExamSchema.index({ subjectName: 1 });
ExamSchema.index({ examCategory: 1 });
ExamSchema.index({ isActive: 1 });
ExamSchema.index({ isPublished: 1 });

// Pre-save middleware to calculate marks breakdown
ExamSchema.pre('save', function(next) {
  const exam = this as ExamDocument;
  
  // Reset marks
  exam.mcqMarks = 0;
  exam.cqMarks = 0;
  exam.writtenMarks = 0;
  
  // Calculate marks from marksFields
  exam.marksFields.forEach(field => {
    if (field.type === 'mcq') {
      exam.mcqMarks += field.totalMarks;
    } else if (field.type === 'cq') {
      exam.cqMarks += field.totalMarks;
    } else if (field.type === 'written') {
      exam.writtenMarks += field.totalMarks;
    }
  });
  
  next();
});

// Virtual populate
ExamSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true,
});

ExamSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true,
});