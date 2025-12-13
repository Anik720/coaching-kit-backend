import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Class } from '../class/class.schema';
import { Subject } from '../subject/subject.schema';
import { Group } from '../group/group.schema';
import { User } from 'src/users/schemas/user.schema';


export type BatchDocument = Batch & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Batch {
  @Prop({ required: true, trim: true })
  batchName: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  className: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  })
  group: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true,
  })
  subject: Types.ObjectId;

  @Prop({
    required: false, // Changed from required: true
    validate: {
      validator: (value: string) => /^\d{4}-\d{4}$/.test(value),
      message: 'Session year must be in format YYYY-YYYY',
    },
  })
  sessionYear: string;

  @Prop({ required: true, type: Date })
  batchStartingDate: Date;

  @Prop({ required: true, type: Date })
  batchClosingDate: Date;

  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
  })
  admissionFee: number;

  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
  })
  tuitionFee: number;

  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
  })
  courseFee: number;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'completed', 'upcoming'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop({
    type: Number,
    min: 1,
    max: 1000,
    default: 50,
  })
  maxStudents: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  // Virtual populate for referencing
  classDetails?: Class;
  groupDetails?: Group;
  subjectDetails?: Subject;
  creatorDetails?: User;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);

// Create compound unique index
BatchSchema.index(
  { batchName: 1, className: 1, group: 1, subject: 1 },
  { unique: true },
);

// Create indexes for better query performance
BatchSchema.index({ sessionYear: 1 });
BatchSchema.index({ batchStartingDate: 1 });
BatchSchema.index({ batchClosingDate: 1 });
BatchSchema.index({ status: 1, isActive: 1 });
BatchSchema.index({ createdBy: 1 });

// Virtual population
BatchSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'className',
  foreignField: '_id',
  justOne: true,
});

BatchSchema.virtual('groupDetails', {
  ref: 'Group',
  localField: 'group',
  foreignField: '_id',
  justOne: true,
});

BatchSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subject',
  foreignField: '_id',
  justOne: true,
});

BatchSchema.virtual('creatorDetails', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to validate dates and auto-generate sessionYear
BatchSchema.pre('save', function (next) {
  // Validate dates
  if (this.batchStartingDate >= this.batchClosingDate) {
    next(new Error('Batch starting date must be before closing date'));
    return;
  }
  
  // Calculate session year from starting date if not provided
  if (!this.sessionYear && this.batchStartingDate) {
    const startYear = this.batchStartingDate.getFullYear();
    this.sessionYear = `${startYear}-${startYear + 1}`;
  } else if (this.sessionYear && !/^\d{4}-\d{4}$/.test(this.sessionYear)) {
    // Validate sessionYear format if provided
    next(new Error('Session year must be in format YYYY-YYYY'));
    return;
  } else if (!this.sessionYear) {
    // If no sessionYear and no batchStartingDate (though batchStartingDate is required)
    next(new Error('Session year is required'));
    return;
  }
  
  next();
});