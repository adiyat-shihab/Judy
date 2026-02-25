import mongoose, { Document, Schema } from 'mongoose';

export enum RequestStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export interface IRequest extends Document {
  projectId: mongoose.Types.ObjectId;
  solverId: mongoose.Types.ObjectId;
  status: RequestStatus;
}

const requestSchema = new Schema<IRequest>(
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
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
  },
  { timestamps: true }
);

// A solver can only request to work on a project once
requestSchema.index({ projectId: 1, solverId: 1 }, { unique: true });

const Request = mongoose.model<IRequest>('Request', requestSchema);
export default Request;
