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
  VISITING_TEACHER = 'visiting_teacher',
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  DEPARTMENT_HEAD = 'department_head'
}

export enum AssignType {
  MONTHLY_BASIS = 'monthly_basis',
  CLASS_BASIS = 'class_basis',
  BOTH = 'both',
  HOURLY_BASIS = 'hourly_basis'
}

export enum TeacherStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  RESIGNED = 'resigned',
  ON_LEAVE = 'on_leave'
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Teacher {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 100 })
  fullName: string;

  @Prop({ required: true, trim: true })
  fatherName: string;

  @Prop({ required: true, trim: true })
  motherName: string;

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
      validator: (value: string) => /^01[3-9]\d{8}$/.test(value),
      message: 'Contact number must be a valid Bangladeshi number (11 digits starting with 01)'
    }
  })
  contactNumber: string;

  @Prop({ 
    required: true,
    validate: {
      validator: (value: string) => /^01[3-9]\d{8}$/.test(value),
      message: 'Emergency contact number must be a valid Bangladeshi number (11 digits starting with 01)'
    }
  })
  emergencyContactNumber: string;

  @Prop({ required: true })
  presentAddress: string;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop({ 
    required: true,
    validate: {
      validator: (value: string) => /^01[3-9]\d{8}$/.test(value),
      message: 'WhatsApp number must be a valid Bangladeshi number (11 digits starting with 01)'
    }
  })
  whatsappNumber: string;

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
    lowercase: true,
    trim: true,
    validate: {
      validator: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    }
  })
  secondaryEmail?: string;

  @Prop({ 
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (value: string) => /^\d{10,17}$/.test(value),
      message: 'National ID must be 10-17 digits'
    }
  })
  nationalId: string;

  @Prop({ 
    type: String, 
    enum: BloodGroup,
    required: true
  })
  bloodGroup: BloodGroup;

  @Prop()
  profilePicture?: string;

  // System Access
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
  systemEmail: string;

  @Prop({ required: true, minlength: 6 })
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
    enum: TeacherStatus, 
    default: TeacherStatus.ACTIVE,
    index: true 
  })
  status: TeacherStatus;

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
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

// Create indexes for better query performance
TeacherSchema.index({ email: 1 }, { unique: true });
TeacherSchema.index({ systemEmail: 1 }, { unique: true });
TeacherSchema.index({ nationalId: 1 }, { unique: true });
TeacherSchema.index({ fullName: 1 });
TeacherSchema.index({ contactNumber: 1 });
TeacherSchema.index({ whatsappNumber: 1 });
TeacherSchema.index({ status: 1, isActive: 1 });
TeacherSchema.index({ designation: 1 });
TeacherSchema.index({ assignType: 1 });
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

// Method to compare password
TeacherSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcrypt');
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};