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

  // Subject-wise marks with subject ID
  @Prop({
    type: [
      {
        subject: {
          type: Types.ObjectId,
          ref: 'Subject',
          required: true
        },
        subjectName: { type: String, required: true },
        totalMarks: { type: Number, required: true, min: 0 },
        obtainedMarks: { type: Number, required: true, min: 0 },
      }
    ],
    default: [],
  })
  subjectWiseMarks: Array<{
    subject: Types.ObjectId;
    subjectName: string;
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
  subjectDetails?: any[];
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

// Virtual population for subject details
ResultSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subjectWiseMarks.subject',
  foreignField: '_id',
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

  // Validate subject-wise marks if provided
  if (result.subjectWiseMarks && result.subjectWiseMarks.length > 0) {
    // Ensure obtained marks don't exceed total marks per subject
    result.subjectWiseMarks.forEach(subjectMark => {
      if (subjectMark.obtainedMarks > subjectMark.totalMarks) {
        throw new Error(`Obtained marks (${subjectMark.obtainedMarks}) exceed total marks (${subjectMark.totalMarks}) for subject ${subjectMark.subjectName}`);
      }
    });

    // Optional: Validate total of subject-wise marks equals overall marks
    const subjectTotal = result.subjectWiseMarks.reduce((sum, sm) => sum + sm.totalMarks, 0);
    const subjectObtained = result.subjectWiseMarks.reduce((sum, sm) => sum + sm.obtainedMarks, 0);
    
    if (Math.abs(subjectTotal - result.totalMarks) > 0.01) {
      console.warn(`Subject-wise total marks (${subjectTotal}) don't match overall total marks (${result.totalMarks})`);
    }
    
    if (Math.abs(subjectObtained - result.obtainedMarks) > 0.01) {
      console.warn(`Subject-wise obtained marks (${subjectObtained}) don't match overall obtained marks (${result.obtainedMarks})`);
    }
  }

  next();
});