import { Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  USER_ADMIN = 'user_admin',
  STAFF = 'staff',
}

export interface IUser {
  _id?: string | Types.ObjectId;
  id?: string; // added after toIUser conversion
  email: string;
  password: string;
  role: UserRole;

  adminId?: string | Types.ObjectId | null;

  designation?: string;
  salary?: number;
  joiningDate?: Date;

  adName?: string;
  username?: string;
  addressName?: string;
  address?: string;
  addressDescription?: string;
  itemOfName?: string;
  currentAddress?: string;
  responseContentNumber?: string;
  intervalAddress?: string;
  reminderAddress?: string;
  messageNumber?: string;
  numberingLevel?: string;
  material?: string;
  hostName?: string;
  notifyName?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export class CreateUserDto {
  email: string;
  password: string;
  role?: UserRole;
  adminId?: string | Types.ObjectId;
  designation?: string;
  salary?: number;
  joiningDate?: Date;
  adName?: string;
  username?: string;
  addressName?: string;
  address?: string;
  addressDescription?: string;
  itemOfName?: string;
  currentAddress?: string;
  responseContentNumber?: string;
  intervalAddress?: string;
  reminderAddress?: string;
  messageNumber?: string;
  numberingLevel?: string;
  material?: string;
  hostName?: string;
  notifyName?: string;
}

export class UpdateUserDto {
  currentPassword?: string;
  newPassword?: string;
  designation?: string;
  salary?: number;
  joiningDate?: Date;
  adName?: string;
  username?: string;
  addressName?: string;
  address?: string;
  addressDescription?: string;
  itemOfName?: string;
  currentAddress?: string;
  responseContentNumber?: string;
  intervalAddress?: string;
  reminderAddress?: string;
  messageNumber?: string;
  numberingLevel?: string;
  material?: string;
  hostName?: string;
  notifyName?: string;
  role?: UserRole;
}