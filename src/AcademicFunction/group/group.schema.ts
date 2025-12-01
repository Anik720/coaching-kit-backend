import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export type GroupDocument = Group & Document;


@Schema({ timestamps: true })
export class Group {
@Prop({ required: true, unique: true, trim: true })
groupName: string;
}


export const GroupSchema = SchemaFactory.createForClass(Group);


// Create a case-insensitive unique index for groupName
GroupSchema.index({ groupName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });