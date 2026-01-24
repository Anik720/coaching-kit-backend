// combine-result-student.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Use Mongoose's built-in Document type with the schema
export type CombineResultStudentDocument = CombineResultStudent & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CombineResultStudent {
  @Prop({
    type: Types.ObjectId,
    ref: 'CombineResult',
    required: true,
    index: true,
  })
  combineResult: Types.ObjectId;

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

  // Exam-wise marks (dynamic based on exams included)
  @Prop({
    type: Map,
    of: {
      totalMarks: { type: Number, default: 0 },
      obtainedMarks: { type: Number, default: 0 },
      isAbsent: { type: Boolean, default: false },
    },
    default: {},
  })
  examMarks: Map<string, {
    totalMarks: number;
    obtainedMarks: number;
    isAbsent: boolean;
  }>;

  @Prop({
    type: Number,
    default: 0,
  })
  totalMarks: number;

  @Prop({
    type: Number,
    default: 0,
  })
  obtainedMarks: number;

  @Prop({
    type: Number,
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
    default: 0,
  })
  gpa: number;

  @Prop({
    type: Number,
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

  // REMOVED: _id: Types.ObjectId;
  // Mongoose will automatically add _id as Types.ObjectId
  // Don't define it manually

  // Virtual fields
  studentDetails?: any;
  combineResultDetails?: any;
  batchDetails?: any;
}

export const CombineResultStudentSchema = SchemaFactory.createForClass(CombineResultStudent);

// Create compound indexes
CombineResultStudentSchema.index({ combineResult: 1, student: 1 }, { unique: true });
CombineResultStudentSchema.index({ combineResult: 1, position: 1 });
CombineResultStudentSchema.index({ student: 1, class: 1, batch: 1 });

// Virtual population
CombineResultStudentSchema.virtual('studentDetails', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

CombineResultStudentSchema.virtual('combineResultDetails', {
  ref: 'CombineResult',
  localField: 'combineResult',
  foreignField: '_id',
  justOne: true,
});

CombineResultStudentSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware for calculations
CombineResultStudentSchema.pre('save', function (next) {
  const studentResult = this as CombineResultStudentDocument;
  
  // Calculate total obtained marks from all exams
  let totalObtainedMarks = 0;
  let totalPossibleMarks = 0;
  let allAbsent = true;
  
  studentResult.examMarks.forEach((exam, examId) => {
    if (!exam.isAbsent) {
      totalObtainedMarks += exam.obtainedMarks;
      totalPossibleMarks += exam.totalMarks;
      allAbsent = false;
    }
  });
  
  studentResult.totalMarks = totalPossibleMarks;
  studentResult.obtainedMarks = totalObtainedMarks;
  studentResult.isAbsent = allAbsent;
  
  // Calculate percentage if not absent
  if (!allAbsent && totalPossibleMarks > 0) {
    studentResult.percentage = (totalObtainedMarks / totalPossibleMarks) * 100;
  } else {
    studentResult.percentage = 0;
  }
  
  next();
});