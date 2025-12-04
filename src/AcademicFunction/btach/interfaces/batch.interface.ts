import { Document, Types } from 'mongoose';

export interface IBatch extends Document {
  batchName: string;
  className: Types.ObjectId;
  group: Types.ObjectId;
  subject: Types.ObjectId;
  sessionYear: string;
  batchStartingDate: Date;
  batchClosingDate: Date;
  admissionFee: number;
  tuitionFee: number;
  courseFee: number;
  status: string;
  isActive: boolean;
  description: string;
  maxStudents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBatchPopulated extends IBatch {
  classDetails?: {
    _id: Types.ObjectId;
    classname: string;
  };
  groupDetails?: {
    _id: Types.ObjectId;
    groupName: string;
  };
  subjectDetails?: {
    _id: Types.ObjectId;
    subjectName: string;
  };
}

export interface IBatchStats {
  totalBatches: number;
  activeBatches: number;
  completedBatches: number;
  upcomingBatches: number;
  totalRevenue: number;
  averageFee: number;
}