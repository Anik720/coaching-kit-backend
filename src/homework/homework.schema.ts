import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type HomeworkDocument = Homework & Document;

@Schema({ timestamps: true })
export class Homework {
  @Prop({ required: true, trim: true })
  homeworkName: string;

  @Prop({ required: false, trim: true })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  class: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Batch' }],
    required: true,
    default: [],
  })
  batches: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true,
  })
  subject: Types.ObjectId;

  @Prop({ required: true, type: Date })
  homeworkDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  updatedBy: Types.ObjectId | null;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);

// Create indexes for better query performance
HomeworkSchema.index({ homeworkDate: 1 });
HomeworkSchema.index({ class: 1, subject: 1 });
HomeworkSchema.index({ createdBy: 1 });
HomeworkSchema.index({ isActive: 1 });

// Pre-save middleware to ensure homeworkDate is a valid date
HomeworkSchema.pre('save', function (next) {
  if (this.homeworkDate && !(this.homeworkDate instanceof Date)) {
    this.homeworkDate = new Date(this.homeworkDate);
  }
  next();
});