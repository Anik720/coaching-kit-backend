// teacher/schemas/teacher.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherDocument = Teacher & Document;

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

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-'
}

export enum Designation {
  HEAD_TEACHER = 'head_teacher',
  ASSISTANT_TEACHER = 'assistant_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  CO_TEACHER = 'co_teacher',
  VISITING_TEACHER = 'visiting_teacher'
}

export enum AssignType {
  MONTHLY_BASIS = 'monthly_basis',
  CLASS_BASIS = 'class_basis',
  BOTH = 'both'
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Teacher {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true })
  fatherName?: string;

  @Prop({ trim: true })
  motherName?: string;

  @Prop({ 
    type: String, 
    enum: Religion, 
    default: Religion.ISLAM 
  })
  religion: Religion;

  @Prop({ 
    type: String, 
    enum: Gender, 
    required: true 
  })
  gender: Gender;

  @Prop({ required: true, type: Date })
  dateOfBirth: Date;

  @Prop({ 
    required: true,
    validate: {
      validator: (value: string) => /^\d{11}$/.test(value),
      message: 'Contact number must be 11 digits'
    }
  })
  contactNumber: string;

  @Prop({ 
    required: true,
    validate: {
      validator: (value: string) => /^\d{11}$/.test(value),
      message: 'Emergency contact number must be 11 digits'
    }
  })
  emergencyContactNumber: string;

  @Prop({ required: true })
  presentAddress: string;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop({ 
    validate: {
      validator: (value: string) => !value || /^\d{11}$/.test(value),
      message: 'WhatsApp number must be 11 digits'
    }
  })
  whatsappNumber?: string;

  @Prop({ 
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    }
  })
  email: string;

  @Prop({ 
    validate: {
      validator: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    }
  })
  secondaryEmail?: string;

  @Prop({ 
    unique: true,
    sparse: true,
    trim: true
  })
  nationalId?: string;

  @Prop({ 
    type: String, 
    enum: BloodGroup 
  })
  bloodGroup?: BloodGroup;

  @Prop()
  profilePicture?: string;

  // System Access
  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  // Job Information
  @Prop({ 
    type: String, 
    enum: Designation, 
    required: true 
  })
  designation: Designation;

  @Prop({ 
    type: String, 
    enum: AssignType, 
    required: true 
  })
  assignType: AssignType;

  @Prop({ 
    type: Number, 
    min: 0,
    validate: {
      validator: function(this: Teacher, value: number) {
        if (this.assignType === AssignType.MONTHLY_BASIS || this.assignType === AssignType.BOTH) {
          return value !== undefined && value >= 0;
        }
        return true;
      },
      message: 'Monthly total class is required for monthly or both assign type'
    }
  })
  monthlyTotalClass?: number;

  @Prop({ 
    type: Number, 
    min: 0,
    validate: {
      validator: function(this: Teacher, value: number) {
        if (this.assignType === AssignType.MONTHLY_BASIS || this.assignType === AssignType.BOTH) {
          return value !== undefined && value >= 0;
        }
        return true;
      },
      message: 'Salary is required for monthly or both assign type'
    }
  })
  salary?: number;

  @Prop({ required: true, type: Date })
  joiningDate: Date;

  @Prop({ 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'resigned'], 
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
  createdByUser?: any;
  updatedByUser?: any;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

// Create indexes for better query performance
TeacherSchema.index({ email: 1 }, { unique: true });
TeacherSchema.index({ nationalId: 1 }, { unique: true, sparse: true });
TeacherSchema.index({ fullName: 1 });
TeacherSchema.index({ contactNumber: 1 });
TeacherSchema.index({ status: 1, isActive: 1 });
TeacherSchema.index({ createdBy: 1 });
TeacherSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual population for createdBy
TeacherSchema.virtual('createdByUser', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual population for updatedBy
TeacherSchema.virtual('updatedByUser', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Password hashing middleware
TeacherSchema.pre('save', async function(next) {
  const teacher = this as TeacherDocument;
  
  if (!teacher.isModified('password')) return next();
  
  try {
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.genSalt(10);
    teacher.password = await bcrypt.hash(teacher.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});