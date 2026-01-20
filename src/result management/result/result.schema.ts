import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Class } from 'src/AcademicFunction/class/class.schema';
import { Batch } from 'src/AcademicFunction/btach/batch.schema';
import { Exam } from '../create-exam/exam.schema';
import { Student } from 'src/student/schemas/student.schema';

export type ResultDocument = Result & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Result {
  @Prop({
    type: Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true,
  })
  exam: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  })
  student: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  class: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true,
  })
  batch: Types.ObjectId;

  // Marks information
  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  totalMarks: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  obtainedMarks: number;

  @Prop({
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  })
  percentage: number;

  @Prop({
    type: String,
    trim: true,
  })
  grade: string;

  @Prop({
    type: Number,
    min: 0,
    max: 5.0,
  })
  gpa: number;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
  })
  position: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isPassed: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isAbsent: boolean;

  @Prop({
    type: String,
    enum: ['distinction', 'first_class', 'second_class', 'third_class', 'failed'],
  })
  resultClass: string;

  @Prop({
    type: String,
    trim: true,
  })
  remarks: string;

  // Subject-wise marks (for future expansion)
  @Prop({
    type: [
      {
        subject: { type: String, required: true },
        totalMarks: { type: Number, required: true, min: 0 },
        obtainedMarks: { type: Number, required: true, min: 0 },
      }
    ],
    default: [],
  })
  subjectWiseMarks: Array<{
    subject: string;
    totalMarks: number;
    obtainedMarks: number;
  }>;

  // Additional fields
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
  })
  isActive: boolean;

  // Virtual populate
  examDetails?: Exam;
  studentDetails?: Student;
  classDetails?: Class;
  batchDetails?: Batch;
  createdByUser?: any;
  updatedByUser?: any;
}

export const ResultSchema = SchemaFactory.createForClass(Result);

// Create compound indexes
ResultSchema.index({ exam: 1, student: 1 }, { unique: true });
ResultSchema.index({ class: 1, batch: 1, exam: 1 });
ResultSchema.index({ student: 1, exam: 1 });
ResultSchema.index({ isPassed: 1 });
ResultSchema.index({ isActive: 1 });
ResultSchema.index({ position: 1 });
ResultSchema.index({ createdBy: 1 });

// Virtual population
ResultSchema.virtual('examDetails', {
  ref: 'Exam',
  localField: 'exam',
  foreignField: '_id',
  justOne: true,
});

ResultSchema.virtual('studentDetails', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

ResultSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true,
});

ResultSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true,
});

ResultSchema.virtual('createdByUser', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

ResultSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to calculate percentage and status
ResultSchema.pre('save', function (next) {
  const result = this as ResultDocument;

  // Calculate percentage if both marks are provided
  if (result.totalMarks > 0 && result.obtainedMarks >= 0) {
    result.percentage = (result.obtainedMarks / result.totalMarks) * 100;

    // Determine pass/fail if exam has pass marks
    // This will be set by service based on exam configuration
  }

  // Handle absent case
  if (result.isAbsent) {
    result.obtainedMarks = 0;
    result.percentage = 0;
    result.isPassed = false;
  }

  next();
});