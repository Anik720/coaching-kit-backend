import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Class } from '../../class/class.schema';

import { User } from '../../../users/schemas/user.schema';


export type StudentAttendanceListDocument = StudentAttendanceList & Document;

@Schema({ timestamps: true })
export class StudentAttendanceList {
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

  @Prop({
    type: Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  })
  student: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  attendanceDate: Date;

  @Prop({
    type: String,
    enum: ['present', 'absent', 'late', 'leave', 'half_day'],
    default: 'present',
    index: true,
  })
  status: string;

  // Vital measurements from your image
  @Prop({ type: Number, min: 0, max: 100 })
  vitalTherm?: number; // VITAL THERM?

  @Prop({ type: Number, min: 0, max: 100 })
  vitalPerm?: number; // VITAL PERM?

  @Prop({ type: Number, min: 0, max: 100 })
  vitalAsem?: number; // VITAL ASEM?

  @Prop({ type: String, default: '' })
  begin?: string; // BEGIN column

  @Prop({ type: String, default: '' })
  remarks?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

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
}

export const StudentAttendanceListSchema = SchemaFactory.createForClass(StudentAttendanceList);

// Create compound unique index - one attendance per student per day per class+batch
StudentAttendanceListSchema.index(
  { student: 1, class: 1, batch: 1, attendanceDate: 1 },
  { unique: true, name: 'unique_student_daily_attendance' }
);

// Create indexes for better query performance
StudentAttendanceListSchema.index({ attendanceDate: 1, status: 1 });
StudentAttendanceListSchema.index({ class: 1, batch: 1, attendanceDate: 1 });
StudentAttendanceListSchema.index({ student: 1, attendanceDate: 1 });
StudentAttendanceListSchema.index({ createdBy: 1 });

// Pre-save middleware to normalize date to start of day
StudentAttendanceListSchema.pre('save', function (next) {
  if (this.attendanceDate && !(this.attendanceDate instanceof Date)) {
    this.attendanceDate = new Date(this.attendanceDate);
  }

  if (this.attendanceDate instanceof Date) {
    // Set to start of day for consistency
    this.attendanceDate.setHours(0, 0, 0, 0);
  }

  // Validate vital measurements
  if (this.vitalTherm && (this.vitalTherm < 0 || this.vitalTherm > 100)) {
    next(new Error('vitalTherm must be between 0 and 100'));
    return;
  }
  
  if (this.vitalPerm && (this.vitalPerm < 0 || this.vitalPerm > 100)) {
    next(new Error('vitalPerm must be between 0 and 100'));
    return;
  }
  
  if (this.vitalAsem && (this.vitalAsem < 0 || this.vitalAsem > 100)) {
    next(new Error('vitalAsem must be between 0 and 100'));
    return;
  }

  next();
});