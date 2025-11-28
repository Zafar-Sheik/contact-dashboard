// models/StaffMember.ts
import mongoose, { Schema, Document } from "mongoose";
import { Position, Department } from "../constants/StaffMemberConstants";

export interface IStaffMember extends Document {
  name: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

const StaffMemberSchema = new Schema<IStaffMember>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [255, "Name cannot exceed 255 characters"],
    },

    position: {
      type: String,
      enum: Object.values(Position),
      required: [true, "Position is required"],
      trim: true,
      maxlength: [255, "Position cannot exceed 255 characters"],
    },

    department: {
      type: String,
      enum: Object.values(Department),
      required: [true, "Department is required"],
      trim: true,
      maxlength: [255, "Department cannot exceed 255 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // This creates an index automatically
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [50, "Phone number cannot exceed 50 characters"],
    },

    avatar_url: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Remove the duplicate email index - it's already created by "unique: true"
// StaffMemberSchema.index({ email: 1 }, { unique: true }); // REMOVE THIS LINE

// Keep these indexes (they don't duplicate anything)
StaffMemberSchema.index({ department: 1 });
StaffMemberSchema.index({ position: 1 });

// Virtual for formatted created date
StaffMemberSchema.virtual("formatted_created_at").get(function (
  this: IStaffMember
) {
  return this.created_at.toLocaleDateString();
});

export default mongoose.models.StaffMember ||
  mongoose.model<IStaffMember>("StaffMember", StaffMemberSchema);
