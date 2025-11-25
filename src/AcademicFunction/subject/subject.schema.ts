import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, unique: true, trim: true })
  subjectName: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// create a case-insensitive unique index on subjectName (optional but recommended)
SubjectSchema.index({ subjectName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
