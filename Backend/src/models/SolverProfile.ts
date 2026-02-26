import mongoose, { Document, Schema } from 'mongoose';

export interface ISolverProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio: string;
  skills: string[];
  hourlyRate: number | null;
  availability: 'Available' | 'Busy' | 'Not Available';
  location: string;
  portfolio: string; // URL
  languages: string[];
  title: string; // professional headline e.g. "Full-Stack Developer"
}

const solverProfileSchema = new Schema<ISolverProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    skills: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      default: null,
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Not Available'],
      default: 'Available',
    },
    location: {
      type: String,
      default: '',
    },
    portfolio: {
      type: String,
      default: '',
    },
    languages: {
      type: [String],
      default: [],
    },
    title: {
      type: String,
      default: '',
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
  },
  { timestamps: true }
);

const SolverProfile = mongoose.model<ISolverProfile>('SolverProfile', solverProfileSchema);
export default SolverProfile;
