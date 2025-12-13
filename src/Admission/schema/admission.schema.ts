import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdmissionDocument = Admission & Document & {
  checkCompletion: () => boolean;
  age: number;
};

export enum AdmissionStatus {
  PENDING = 'pending',
  INCOMPLETE = 'incomplete',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum AdmissionType {
  MONTHLY = 'monthly',
  COURSE = 'course',
  FULL = 'full'
}

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

export interface BatchSubject {
  subjectName: string;
  subjectId: number;
}

export interface AdmissionBatch {
  batch: Types.ObjectId;
  batchName: string;
  batchId: number;
  subjects: BatchSubject[];
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Admission {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true
  })
  registrationId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  instituteName: string;

  @Prop({
    type: String,
    enum: Gender,
    required: true
  })
  studentGender: Gender;

  @Prop({
    type: String,
    enum: Religion,
    required: true
  })
  religion: Religion;

  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^01[3-9]\d{8}$/.test(v),
      message: 'Please provide a valid Bangladeshi mobile number'
    }
  })
  guardianMobileNumber: string;

  @Prop({ type: Date, default: Date.now })
  admissionDate: Date;

  @Prop({ trim: true })
  nameNative?: string;

  @Prop({ type: Date })
  studentDateOfBirth?: Date;

  @Prop()
  presentAddress?: string;

  @Prop()
  permanentAddress?: string;

  @Prop({
    validate: {
      validator: (v: string) => /^01[3-9]\d{8}$/.test(v),
      message: 'Please provide a valid Bangladeshi mobile number'
    }
  })
  whatsappMobile?: string;

  @Prop({
    validate: {
      validator: (v: string) => /^01[3-9]\d{8}$/.test(v),
      message: 'Please provide a valid Bangladeshi mobile number'
    }
  })
  studentMobileNumber?: string;

  @Prop({ trim: true })
  fathersName?: string;

  @Prop({ trim: true })
  mothersName?: string;

  @Prop({
    validate: {
      validator: (v: string) => /^01[3-9]\d{8}$/.test(v),
      message: 'Please provide a valid Bangladeshi mobile number'
    }
  })
  motherMobileNumber?: string;

  @Prop({
    type: String,
    enum: AdmissionType,
    default: AdmissionType.MONTHLY
  })
  admissionType: AdmissionType;

  @Prop({ type: Number, min: 0, default: 0 })
  courseFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  admissionFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  tuitionFee: number;

  @Prop({ trim: true })
  referBy?: string;

  @Prop({
    type: [{
      batch: { type: Types.ObjectId, ref: 'Batch', required: true },
      batchName: { type: String, required: true },
      batchId: { type: Number, required: true },
      subjects: [{
        subjectName: { type: String, required: true },
        subjectId: { type: Number, required: true },
        _id: false
      }],
      admissionFee: { type: Number, default: 0 },
      tuitionFee: { type: Number, default: 0 },
      courseFee: { type: Number, default: 0 }
    }],
    default: []
  })
  batches: AdmissionBatch[];

  @Prop({
    type: String,
    enum: AdmissionStatus,
    default: AdmissionStatus.PENDING,
    index: true
  })
  status: AdmissionStatus;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: Number, min: 0, default: 0 })
  totalFee: number;

  @Prop({ type: Number, min: 0, default: 0 })
  paidAmount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  dueAmount: number;

  @Prop()
  photoUrl?: string;

  @Prop()
  photoPath?: string;

  @Prop()
  remarks?: string;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const AdmissionSchema = SchemaFactory.createForClass(Admission);

// Virtual for age calculation
AdmissionSchema.virtual('age').get(function(this: AdmissionDocument) {
  if (!this.studentDateOfBirth) return undefined;
  
  const today = new Date();
  const birthDate = new Date(this.studentDateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Instance method to check if admission is complete
AdmissionSchema.methods.checkCompletion = function(this: AdmissionDocument): boolean {
  const requiredFields = [
    'name',
    'instituteName',
    'studentGender',
    'religion',
    'guardianMobileNumber'
  ];
  
  return requiredFields.every(field => {
    const value = this[field as keyof AdmissionDocument];
    return value !== undefined && value !== null && value !== '';
  });
};

// Pre-save middleware to update calculated fields
AdmissionSchema.pre('save', function(this: AdmissionDocument, next) {
  // Calculate total fee
  const batchTotal = this.batches.reduce((sum, batch) => {
    return sum + (batch.admissionFee || 0) + (batch.tuitionFee || 0) + (batch.courseFee || 0);
  }, 0);
  
  // Use batch total if provided, otherwise use admission form values
  if (batchTotal > 0) {
    this.totalFee = batchTotal;
  } else {
    this.totalFee = (this.admissionFee || 0) + (this.tuitionFee || 0) + (this.courseFee || 0);
  }
  
  // Calculate due amount
  this.dueAmount = this.totalFee - (this.paidAmount || 0);
  
  // Update completion status
  this.isCompleted = this.checkCompletion();
  
  // Update status based on completion
  if (this.isCompleted && this.status === AdmissionStatus.PENDING) {
    this.status = AdmissionStatus.COMPLETED;
    this.completedAt = new Date();
  }
  
  next();
});

// Pre-findOneAndUpdate middleware to handle updates
AdmissionSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  // Calculate total fee if batches are updated
  if (update.batches) {
    const batchTotal = update.batches.reduce((sum: number, batch: AdmissionBatch) => {
      return sum + (batch.admissionFee || 0) + (batch.tuitionFee || 0) + (batch.courseFee || 0);
    }, 0);
    
    if (batchTotal > 0) {
      update.totalFee = batchTotal;
    } else {
      update.totalFee = (update.admissionFee || 0) + (update.tuitionFee || 0) + (update.courseFee || 0);
    }
  }
  
  // Calculate due amount if fees are updated
  if (update.totalFee !== undefined || update.paidAmount !== undefined) {
    const totalFee = update.totalFee !== undefined ? update.totalFee : this.get('totalFee');
    const paidAmount = update.paidAmount !== undefined ? update.paidAmount : this.get('paidAmount');
    update.dueAmount = totalFee - (paidAmount || 0);
  }
  
  next();
});

// Indexes for better query performance
AdmissionSchema.index({ registrationId: 1 });
AdmissionSchema.index({ name: 1 });
AdmissionSchema.index({ guardianMobileNumber: 1 });
AdmissionSchema.index({ whatsappMobile: 1 });
AdmissionSchema.index({ studentMobileNumber: 1 });
AdmissionSchema.index({ status: 1, isCompleted: 1 });
AdmissionSchema.index({ createdAt: -1 });
AdmissionSchema.index({ admissionDate: -1 });
AdmissionSchema.index({ fathersName: 'text', mothersName: 'text', name: 'text', instituteName: 'text' });
AdmissionSchema.index({ createdBy: 1 });