// attendance/schemas/teacher-attendance.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Teacher } from 'src/teacher/schemas/teacher.schema';
import { Class } from 'src/AcademicFunction/class/class.schema';
import { Subject } from 'src/AcademicFunction/subject/subject.schema';

export type TeacherAttendanceDocument = TeacherAttendance & Document;

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  LEAVE = 'leave',
  HOLIDAY = 'holiday'
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TeacherAttendance {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Teacher', 
    required: true,
    index: true 
  })
  teacher: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  date: Date;

  // Class/Batch/Subject details for each attendance entry
  @Prop([{
    class: { 
      type: Types.ObjectId, 
      ref: 'Class',
      required: true 
    },
    batch: { 
      type: Types.ObjectId, 
      ref: 'Batch',
      required: true 
    },
    subject: { 
      type: Types.ObjectId, 
      ref: 'Subject',
      required: true 
    },
    status: {
      type: String,
      enum: AttendanceStatus,
      default: AttendanceStatus.PRESENT,
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }])
  attendanceDetails: {
    class: Types.ObjectId;
    batch: Types.ObjectId;
    subject: Types.ObjectId;
    status: AttendanceStatus;
    remarks?: string;
  }[];

  @Prop({ 
    type: Number, 
    min: 0,
    default: 0 
  })
  totalClasses: number;

  @Prop({ 
    type: Number, 
    min: 0,
    default: 0 
  })
  attendedClasses: number;

  @Prop({ 
    type: Number, 
    min: 0,
    default: 0 
  })
  absentClasses: number;

  @Prop({ 
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'pending'],
    default: 'submitted',
    index: true 
  })
  approvalStatus: string;

  @Prop()
  submittedBy?: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User',
    default: null 
  })
  approvedBy?: Types.ObjectId | null;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop()
  approvalRemarks?: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  createdBy: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    default: null 
  })
  updatedBy?: Types.ObjectId | null;

  // Virtual populate for referencing
  teacherDetails?: Teacher;
  createdByUser?: any;
  updatedByUser?: any;
  approvedByUser?: any;
}

export const TeacherAttendanceSchema = SchemaFactory.createForClass(TeacherAttendance);

// Create indexes for better query performance
TeacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });
TeacherAttendanceSchema.index({ date: 1 });
TeacherAttendanceSchema.index({ teacher: 1, date: -1 });
TeacherAttendanceSchema.index({ approvalStatus: 1 });
TeacherAttendanceSchema.index({ createdBy: 1 });
TeacherAttendanceSchema.index({ 'attendanceDetails.class': 1 });
TeacherAttendanceSchema.index({ 'attendanceDetails.batch': 1 });
TeacherAttendanceSchema.index({ 'attendanceDetails.subject': 1 });

// Virtual population for teacher
TeacherAttendanceSchema.virtual('teacherDetails', {
  ref: 'Teacher',
  localField: 'teacher',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for createdBy
TeacherAttendanceSchema.virtual('createdByUser', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for updatedBy
TeacherAttendanceSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for approvedBy
TeacherAttendanceSchema.virtual('approvedByUser', {
  ref: 'User',
  localField: 'approvedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for class details in attendance
TeacherAttendanceSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'attendanceDetails.class',
  foreignField: '_id',
  justOne: false,
});

// Virtual population for batch details in attendance
TeacherAttendanceSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'attendanceDetails.batch',
  foreignField: '_id',
  justOne: false,
});

// Virtual population for subject details in attendance
TeacherAttendanceSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'attendanceDetails.subject',
  foreignField: '_id',
  justOne: false,
});

// Pre-save middleware to calculate summary
TeacherAttendanceSchema.pre('save', function(next) {
  const attendance = this as TeacherAttendanceDocument;
  
  if (attendance.attendanceDetails && attendance.attendanceDetails.length > 0) {
    attendance.totalClasses = attendance.attendanceDetails.length;
    
    const attended = attendance.attendanceDetails.filter(
      detail => detail.status === AttendanceStatus.PRESENT || 
               detail.status === AttendanceStatus.LATE ||
               detail.status === AttendanceStatus.HALF_DAY
    ).length;
    
    const absent = attendance.attendanceDetails.filter(
      detail => detail.status === AttendanceStatus.ABSENT
    ).length;
    
    attendance.attendedClasses = attended;
    attendance.absentClasses = absent;
  }
  
  next();
});