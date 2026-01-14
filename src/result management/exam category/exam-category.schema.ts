import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamCategoryDocument = ExamCategory & Document;

@Schema({ timestamps: true })
export class ExamCategory {
  @Prop({ required: true, unique: true })
  categoryName: string;

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

export const ExamCategorySchema = SchemaFactory.createForClass(ExamCategory);