import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  departmentId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'department_user'], required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
