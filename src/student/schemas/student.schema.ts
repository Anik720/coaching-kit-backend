import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Batch } from 'src/AcademicFunction/btach/batch.schema';
import { Class } from 'src/AcademicFunction/class/class.schema';

export type StudentDocument = Student & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum Religion {
  ISLAM = 'islam',
  HINDUISM = 'hinduism',
  CHRISTIANITY = 'christianity',
  BUDDHISM = 'buddhism',
  OTHER = 'other'
}

export enum AdmissionType {
  MONTHLY = 'monthly',
  COURSE = 'course'
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Student {
  @Prop({ required: true, trim: true })
  registrationId: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Class', 
    required: true,
    index: true 
  })
  class: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Batch', 
    required: true,
    index: true 
  })
  batch: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nameEnglish: string;

  @Prop({ trim: true })
  subunitCategory?: string;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ 
    type: String, 
    enum: Gender, 
    required: true 
  })
  gender: Gender;

  @Prop({ 
    type: String, 
    enum: Religion, 
    default: Religion.ISLAM 
  })
  religion: Religion;

  @Prop({ 
    unique: true, 
    sparse: true,
    validate: {
      validator: (value: string) => !value || /^\d{10,15}$/.test(value),
      message: 'Mobile number must be 10-15 digits'
    }
  })
  studentMobileNumber?: string;

  @Prop({ 
    unique: true, 
    sparse: true,
    validate: {
      validator: (value: string) => !value || /^\d+$/.test(value),
      message: 'Ward number must contain only digits'
    }
  })
  wardNumber?: string;

  @Prop({ required: true })
  presentAddress: string;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop()
  photoUrl?: string;

  @Prop({ required: true })
  fatherName: string;

  @Prop({ 
    required: true,
    validate: {
      validator: (value: string) => /^\d{10,15}$/.test(value),
      message: 'Mobile number must be 10-15 digits'
    }
  })
  fatherMobileNumber: string;

  @Prop()
  motherName: string;

  @Prop({ 
    validate: {
      validator: (value: string) => !value || /^\d{10,15}$/.test(value),
      message: 'Mobile number must be 10-15 digits'
    }
  })
  motherMobileNumber?: string;

  // Payment Information
  @Prop({ 
    type: String, 
    enum: AdmissionType, 
    required: true 
  })
  admissionType: AdmissionType;

  @Prop({ type: Number, min: 0, default: 0 })
  admissionFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  monthlyTuitionFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  courseFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalAmount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  paidAmount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  dueAmount: number;

  @Prop({ type: Date })
  admissionDate: Date;

  @Prop({ type: Date })
  nextPaymentDate?: Date;

  @Prop()
  referredBy?: string;

  @Prop({ 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'completed'], 
    default: 'active',
    index: true 
  })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  remarks?: string;

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
  classDetails?: Class;
  batchDetails?: Batch;
  createdByUser?: any;
  updatedByUser?: any;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

// Create compound indexes for better query performance
StudentSchema.index({ registrationId: 1 }, { unique: true });
StudentSchema.index({ class: 1, batch: 1 });
StudentSchema.index({ nameEnglish: 1 });
StudentSchema.index({ fatherMobileNumber: 1 });
StudentSchema.index({ status: 1, isActive: 1 });
StudentSchema.index({ createdBy: 1 });
StudentSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual population for class
StudentSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for batch
StudentSchema.virtual('batchDetails', {
  ref: 'Batch',
  localField: 'batch',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for createdBy
StudentSchema.virtual('createdByUser', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for updatedBy
StudentSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// PRE-VALIDATE middleware runs BEFORE Mongoose validation
StudentSchema.pre('validate', function (next) {
  const student = this as StudentDocument;

  // Generate registration ID if not provided (before validation)
  if (!student.registrationId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    student.registrationId = `${year}${randomNum}`;
  }

  // Set admission date if not provided
  if (!student.admissionDate) {
    student.admissionDate = new Date();
  }

  // Ensure numeric values exist to avoid NaN
  student.admissionFee = typeof student.admissionFee === 'number' ? student.admissionFee : 0;
  student.monthlyTuitionFee = typeof student.monthlyTuitionFee === 'number' ? student.monthlyTuitionFee : 0;
  student.courseFee = typeof student.courseFee === 'number' ? student.courseFee : 0;
  student.paidAmount = typeof student.paidAmount === 'number' ? student.paidAmount : 0;

  // Calculate total amount based on admission type
  if (student.admissionType === AdmissionType.MONTHLY) {
    student.totalAmount = student.admissionFee + student.monthlyTuitionFee;
  } else if (student.admissionType === AdmissionType.COURSE) {
    student.totalAmount = student.admissionFee + student.courseFee;
  } else {
    student.totalAmount = student.admissionFee || 0;
  }

  // Calculate due amount
  student.dueAmount = (student.totalAmount || 0) - (student.paidAmount || 0);

  next();
});