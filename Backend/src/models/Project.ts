import mongoose, { Document, Schema } from 'mongoose';

export enum ProjectStatus {
  UNASSIGNED = 'Unassigned',
  ASSIGNED = 'Assigned',
  COMPLETED = 'Completed',
}

export interface IProject extends Document {
  title: string;
  description: string;
  buyerId: mongoose.Types.ObjectId;
  solverId?: mongoose.Types.ObjectId;
  status: ProjectStatus;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a project description'],
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    solverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.UNASSIGNED,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
