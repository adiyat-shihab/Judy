import mongoose, { Document, Schema } from 'mongoose';

export enum TaskStatus {
  IN_PROGRESS = 'In-progress',
  SUBMITTED = 'Submitted',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  solverId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  timeline: Date;
  status: TaskStatus;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    solverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a task description'],
    },
    timeline: {
      type: Date,
      required: [true, 'Please add a deadline'],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.IN_PROGRESS,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task;
