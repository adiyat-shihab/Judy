import mongoose, { Document, Schema } from 'mongoose';

export enum ApplicationStatus {
  PENDING  = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface IBuyerApplication extends Document {
  solverId:  mongoose.Types.ObjectId;
  reason:    string;
  status:    ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IBuyerApplication>(
  {
    solverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    reason:   { type: String, required: true, maxlength: 1000 },
    status:   { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.PENDING },
  },
  { timestamps: true }
);

export default mongoose.model<IBuyerApplication>('BuyerApplication', applicationSchema);
