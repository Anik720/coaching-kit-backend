import { Document, Types } from 'mongoose';
import { ExamCategory, ExamStatus } from '../exam.schema';


export interface IExam extends Document {
  examName: string;
  class: Types.ObjectId;
  subject: Types.ObjectId;
  batches: Types.ObjectId[];
  category: ExamCategory;
  examDate: Date;
  startTime: Date;
  endTime: Date;
  showMarksInResult: boolean;
  marksDistribution: { type: string; marks: number }[];
  totalMarks: number;
  enableGrading: boolean;
  gradingSystem: { grade: string; minMarks: number; maxMarks: number; points: number }[];
  passMarks: number;
  status: ExamStatus;
  isActive: boolean;
  instructions?: string;
  location?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamStats {
  totalExams: number;
  scheduledExams: number;
  ongoingExams: number;
  completedExams: number;
  draftExams: number;
  averageMarks: number;
  upcomingExams: number;
}

export interface IExamPopulated extends IExam {
  classDetails?: {
    _id: Types.ObjectId;
    classname: string;
  };
  subjectDetails?: {
    _id: Types.ObjectId;
    subjectName: string;
  };
  batchDetails?: Array<{
    _id: Types.ObjectId;
    batchName: string;
  }>;
  creatorDetails?: {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  updaterDetails?: {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}