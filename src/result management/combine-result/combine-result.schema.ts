// combine-result.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CombineResultDocument = CombineResult & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CombineResult {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  class: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Batch' }],
    default: [],
    index: true,
  })
  batches: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Exam' }],
    required: true,
    default: [],
  })
  exams: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['class_test', 'mid_term', 'final', 'mock_test', 'custom'],
    required: true,
    index: true,
  })
  category: string;

  @Prop({
    type: Date,
    required: true,
  })
  startDate: Date;

  @Prop({
    type: Date,
    required: true,
  })
  endDate: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  totalMarks: number;

  @Prop({
    type: Number,
    default: 0,
  })
  mcqMarks: number;

  @Prop({
    type: Number,
    default: 0,
  })
  cqMarks: number;

  @Prop({
    type: Number,
    default: 0,
  })
  writtenMarks: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  updatedBy: Types.ObjectId | null;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isPublished: boolean;

  // Virtual fields
  classDetails?: any;
  batchDetails?: any[];
  examDetails?: any[];
  createdByUser?: any;
  updatedByUser?: any;
  studentResults?: any[];
}

export const CombineResultSchema = SchemaFactory.createForClass(CombineResult);

// Create compound indexes
CombineResultSchema.index({ class: 1, batches: 1 });
CombineResultSchema.index({ createdBy: 1, createdAt: -1 });
CombineResultSchema.index({ category: 1, isPublished: 1 });

// Virtual population
CombineResultSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true,
});

CombineResultSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batches',
  foreignField: '_id',
});

CombineResultSchema.virtual('examDetails', {
  ref: 'Exam',
  localField: 'exams',
  foreignField: '_id',
});

CombineResultSchema.virtual('createdByUser', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'email username role' }
});

CombineResultSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'email username role' }
});