import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  solverId: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  submittedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    solverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
export default Submission;
