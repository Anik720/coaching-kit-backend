import { Document } from 'mongoose';

export interface IInstitute extends Document {
  instituteName: string;
  address: string;
  phone: string;
  email: string;
  profilePicture?: string;
  profilePictureUrl?: string;
  isActive: boolean;
  description?: string;
  establishmentDate?: Date;
  principalName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstituteStats {
  totalInstitutes: number;
  activeInstitutes: number;
  totalPhoneContacts: number;
  latestEstablishment?: Date;
  oldestEstablishment?: Date;
}

export interface InstituteQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}