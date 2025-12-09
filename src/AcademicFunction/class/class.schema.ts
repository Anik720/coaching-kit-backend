import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, unique: true })
  classname: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    // Remove default: null since it's required
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

export const ClassSchema = SchemaFactory.createForClass(Class);