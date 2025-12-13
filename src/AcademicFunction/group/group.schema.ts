import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, unique: true, trim: true })
  groupName: string;

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

export const GroupSchema = SchemaFactory.createForClass(Group);

// Create a case-insensitive unique index for groupName
GroupSchema.index({ groupName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });