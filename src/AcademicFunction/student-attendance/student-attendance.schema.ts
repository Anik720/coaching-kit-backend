import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentAttendanceDocument = StudentAttendance & Document;

export enum AttendanceType {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class StudentAttendance {
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

  // Stored as start-of-day (00:00:00.000) to support unique index by date
  @Prop({ required: true, type: Date, index: true })
  attendanceDate: Date;

  // "HH:mm" 24h format
  @Prop({ required: false, trim: true })
  classStartTime?: string;

  // "HH:mm" 24h format
  @Prop({ required: false, trim: true })
  classEndTime?: string;

  @Prop({
    type: String,
    enum: AttendanceType,
    default: AttendanceType.PRESENT,
    index: true,
  })
  attendanceType: AttendanceType;

  @Prop({ required: false, trim: true, default: '' })
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
  updatedBy?: Types.ObjectId | null;
}

export const StudentAttendanceSchema = SchemaFactory.createForClass(StudentAttendance);

// Uniqueness: one attendance record per class+batch+day
StudentAttendanceSchema.index(
  { class: 1, batch: 1, attendanceDate: 1 },
  { unique: true },
);

StudentAttendanceSchema.pre('save', function (next) {
  if (this.attendanceDate && !(this.attendanceDate instanceof Date)) {
    this.attendanceDate = new Date(this.attendanceDate);
  }

  if (this.attendanceDate instanceof Date) {
    this.attendanceDate.setHours(0, 0, 0, 0);
  }

  next();
});