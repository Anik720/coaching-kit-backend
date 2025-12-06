import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../shared/interfaces/user.interface';

// Proper document type for full type safety
export type UserDocument = User & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      const r = ret as any;
      delete r.password;
      delete r.__v;
      r.id = ret._id?.toString();
      delete r._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      const r = ret as any;
      delete r.password;
      delete r.__v;
      r.id = ret._id?.toString();
      delete r._id;
      return ret;
    },
  },
})
export class User extends Document<Types.ObjectId> {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 6,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STAFF,
    required: true,
  })
  role: UserRole;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  adminId: Types.ObjectId | null;

  // Job Information
  @Prop({ default: 'Staff', trim: true })
  designation: string;

  @Prop({ default: 0, min: 0 })
  salary: number;

  @Prop({ type: Date, default: Date.now })
  joiningDate: Date;

  // Basic Information
  @Prop({ trim: true }) adName: string;
  @Prop({ trim: true }) username: string;
  @Prop({ trim: true }) addressName: string;
  @Prop({ trim: true }) address: string;
  @Prop({ trim: true }) addressDescription: string;
  @Prop({ trim: true }) itemOfName: string;
  @Prop({ trim: true }) currentAddress: string;
  @Prop({ trim: true }) responseContentNumber: string;
  @Prop({ trim: true }) intervalAddress: string;
  @Prop({ trim: true }) reminderAddress: string;
  @Prop({ trim: true }) messageNumber: string;
  @Prop({ trim: true }) numberingLevel: string;
  @Prop({ trim: true }) material: string;
  @Prop({ trim: true }) hostName: string;
  @Prop({ trim: true }) notifyName: string;

  // Virtual
  get adminInfo(): any {
    return this.adminId ? { _id: this.adminId } : null;
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async updatePassword(newPassword: string): Promise<void> {
    this.password = await bcrypt.hash(newPassword, 10);
    await this.save();
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }

  isUserAdmin(): boolean {
    return this.role === UserRole.USER_ADMIN;
  }

  isStaff(): boolean {
    return this.role === UserRole.STAFF;
  }

  canManageUser(targetUser: UserDocument): boolean {
    if (this.isSuperAdmin()) return true;

    if (this.isUserAdmin()) {
      if (targetUser.isSuperAdmin()) return false;
      if (targetUser.isUserAdmin() && !targetUser._id.equals(this._id)) return false;
      if (targetUser.isStaff() && !targetUser.adminId?.equals(this._id)) return false;
      return true;
    }

    return this._id.equals(targetUser._id);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  const user = this as any;

  if (!user.isModified('password')) return next();

  try {
    if (user.password && !user.password.startsWith('$2b$')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ adminId: 1 });
UserSchema.index({ createdAt: -1 });