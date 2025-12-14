import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, unique: true, trim: true })
  subjectName: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  createdBy: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    default: null 
  })
  updatedBy: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  description: string | null;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// Create a case-insensitive unique index for subjectName
SubjectSchema.index({ subjectName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });