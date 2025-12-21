import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type InstituteDocument = Institute & Document;

@Schema({ timestamps: true })
export class Institute {
  @ApiProperty({ example: 'Fahim Academy', description: 'Institute name' })
  @Prop({
    type: String,
    required: [true, 'Institute name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Institute name must be at least 2 characters'],
    maxlength: [200, 'Institute name cannot exceed 200 characters']
  })
  instituteName: string;

  @ApiProperty({ 
    example: 'Gulkibari Kazi Office Road, Mymensingh', 
    description: 'Institute address' 
  })
  @Prop({
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  })
  address: string;

  @ApiProperty({ 
    example: '0170388696', 
    description: 'Institute phone number' 
  })
  @Prop({
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9]{10,15}$/.test(v);
      },
      message: 'Phone number must be 10-15 digits'
    }
  })
  phone: string;

  @ApiProperty({ 
    example: 'fahimacademy10@gmail.com', 
    description: 'Institute email' 
  })
  @Prop({
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  })
  email: string;

  @ApiProperty({ 
    example: 'institute-logo.jpg', 
    description: 'Institute logo/picture filename',
    required: false 
  })
  @Prop({
    type: String,
    default: null
  })
  profilePicture: string;

  @ApiProperty({ 
    example: 'https://example.com/logo.jpg', 
    description: 'Profile picture URL',
    required: false 
  })
  @Prop({
    type: String,
    default: null
  })
  profilePictureUrl: string;

  @ApiProperty({ 
    example: true, 
    description: 'Institute active status',
    default: true 
  })
  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;

  @ApiProperty({ 
    example: 'Additional information about the institute', 
    description: 'Institute description',
    required: false 
  })
  @Prop({
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: null
  })
  description: string;

  @ApiProperty({ 
    example: '2023-01-01T00:00:00.000Z', 
    description: 'Institute establishment date',
    required: false 
  })
  @Prop({
    type: Date,
    default: null
  })
  establishmentDate: Date;

  @ApiProperty({ 
    example: 'Fahim Ahmed', 
    description: 'Institute principal/head name',
    required: false 
  })
  @Prop({
    type: String,
    maxlength: [100, 'Principal name cannot exceed 100 characters'],
    default: null
  })
  principalName: string;

  // Auto-generated timestamps
  @ApiProperty({ 
    example: '2023-12-06T10:30:00.000Z', 
    description: 'Creation timestamp' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2023-12-06T10:30:00.000Z', 
    description: 'Last update timestamp' 
  })
  updatedAt: Date;
}

export const InstituteSchema = SchemaFactory.createForClass(Institute);

// Create indexes for better query performance
InstituteSchema.index({ instituteName: 1 }, { unique: true });
InstituteSchema.index({ email: 1 }, { unique: true });
InstituteSchema.index({ isActive: 1 });
InstituteSchema.index({ createdAt: -1 });