import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// Remove incorrect import: import { Subject } from 'rxjs';

// Import your actual schemas with correct paths
// Based on your file structure:

// You need to create or import Subject schema


export type ExamDocument = Exam & Document;

// Exam Categories based on your image
export enum ExamCategory {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PRACTICAL = 'practical',
}

// Exam Status
export enum ExamStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Exam {
  @Prop({ required: true, trim: true, maxlength: 200 })
  examName: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  class: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subject: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Batch' }],
    required: true,
    validate: {
      validator: (value: Types.ObjectId[]) => value.length > 0,
      message: 'At least one batch must be selected',
    },
  })
  batches: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ExamCategory,
    required: true,
    default: ExamCategory.MIDTERM,
  })
  category: ExamCategory;

  @Prop({ required: true, type: Date })
  examDate: Date;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({ default: true })
  showMarksInResult: boolean;

  @Prop({
    type: [
      {
        type: { type: String, required: true }, // e.g., 'MCQ', 'CQ', 'Written'
        marks: { type: Number, required: true, min: 0 },
      },
    ],
    default: [],
  })
  marksDistribution: { type: string; marks: number }[];

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  totalMarks: number;

  @Prop({ default: false })
  enableGrading: boolean;

  @Prop({
    type: [
      {
        grade: { type: String, required: true }, // e.g., 'A+', 'A', 'B+'
        minMarks: { type: Number, required: true, min: 0 },
        maxMarks: { type: Number, required: true, min: 0 },
        points: { type: Number, required: true, min: 0 },
      },
    ],
    default: [],
  })
  gradingSystem: { grade: string; minMarks: number; maxMarks: number; points: number }[];

  @Prop({ type: Number, min: 0, max: 100, default: 40 })
  passMarks: number;

  @Prop({
    type: String,
    enum: ExamStatus,
    default: ExamStatus.DRAFT,
    index: true,
  })
  status: ExamStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  instructions: string;

  @Prop({ type: String })
  location: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  // Virtual fields for populated data - using TypeScript interfaces
  // Remove the Subject type error by using any or create proper interface
  classDetails?: any; // Replace with proper type: Class
  subjectDetails?: any; // Replace with proper type: Subject
  batchDetails?: any[]; // Replace with proper type: Batch[]
  creatorDetails?: any; // Replace with proper type: User
  updaterDetails?: any; // Replace with proper type: User
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Indexes for better query performance
ExamSchema.index({ examDate: 1 });
ExamSchema.index({ class: 1, subject: 1 });
ExamSchema.index({ status: 1, isActive: 1 });
ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ 'batches._id': 1 });

// Compound index for unique exam name per class, subject, and category
ExamSchema.index(
  { examName: 1, class: 1, subject: 1, category: 1 },
  { unique: true, sparse: true }
);

// Virtual population
ExamSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true,
});

ExamSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subject',
  foreignField: '_id',
  justOne: true,
});

ExamSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batches',
  foreignField: '_id',
});

ExamSchema.virtual('creatorDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

ExamSchema.virtual('updaterDetails', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to calculate total marks
ExamSchema.pre('save', function (next) {
  // Calculate total marks from marks distribution
  if (this.marksDistribution && this.marksDistribution.length > 0) {
    this.totalMarks = this.marksDistribution.reduce(
      (sum, item) => sum + item.marks,
      0,
    );
  }
  
  // Validate exam dates
  if (this.startTime >= this.endTime) {
    next(new Error('Exam start time must be before end time'));
    return;
  }
  
  // Validate that examDate matches the date part of startTime
  const examDateStr = this.examDate.toISOString().split('T')[0];
  const startDateStr = this.startTime.toISOString().split('T')[0];
  
  if (examDateStr !== startDateStr) {
    next(new Error('Exam date must match the start time date'));
    return;
  }
  
  // Validate grading system if enabled
  if (this.enableGrading && this.gradingSystem && this.gradingSystem.length > 0) {
    // Sort grading system by minMarks
    this.gradingSystem.sort((a, b) => a.minMarks - b.minMarks);
    
    // Validate overlapping ranges
    for (let i = 0; i < this.gradingSystem.length - 1; i++) {
      if (this.gradingSystem[i].maxMarks >= this.gradingSystem[i + 1].minMarks) {
        next(new Error('Grading system ranges must not overlap'));
        return;
      }
    }
    
    // Validate that max marks don't exceed total marks
    const highestMaxMarks = this.gradingSystem[this.gradingSystem.length - 1].maxMarks;
    if (highestMaxMarks > this.totalMarks) {
      next(new Error('Grading system max marks cannot exceed total marks'));
      return;
    }
    
    // Validate pass marks within total marks
    const passMarksValue = (this.passMarks / 100) * this.totalMarks;
    if (passMarksValue > this.totalMarks) {
      next(new Error('Pass marks cannot exceed total marks'));
      return;
    }
  }
  
  // Auto-update status based on dates
  const now = new Date();
  if (this.startTime > now) {
    this.status = ExamStatus.SCHEDULED;
  } else if (this.startTime <= now && this.endTime >= now) {
    this.status = ExamStatus.ONGOING;
  } else if (this.endTime < now) {
    this.status = ExamStatus.COMPLETED;
  }
  
  next();
});

// Pre-update middleware for findOneAndUpdate operations
ExamSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  
  // Calculate total marks if marksDistribution is being updated
  if (update.marksDistribution && update.marksDistribution.length > 0) {
    update.totalMarks = update.marksDistribution.reduce(
      (sum: number, item: { marks: number }) => sum + item.marks,
      0,
    );
  }
  
  next();
});