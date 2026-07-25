import mongoose, { Document, Schema, Types } from 'mongoose';
import { TaskPriority, TaskStoredStatus } from '../types';

export interface ITask extends Document {
  title: string;
  description: string;
  departmentId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  priority: TaskPriority;
  dueDate: Date | null;
  status: TaskStoredStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
