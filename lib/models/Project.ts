// models/Project.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ProjectStatus } from "../constants/ProjectConstants";

export interface IProject extends Document {
  name: string;
  description?: string;
  manager: Types.ObjectId;
  status: ProjectStatus;
  budget?: number;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [255, "Project name cannot exceed 255 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "StaffMember",
      required: [true, "Project manager is required"],
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.NOT_STARTED,
      required: true,
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "End date is required"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Validate that end_date is after start_date
ProjectSchema.path("end_date").validate(function (this: IProject, value: Date) {
  return value >= this.start_date;
}, "End date must be after start date");

// Index for better query performance
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ manager: 1 });
ProjectSchema.index({ start_date: -1 });
ProjectSchema.index({ end_date: -1 });

// Compound index for frequently queried combinations
ProjectSchema.index({ status: 1, start_date: -1 });
ProjectSchema.index({ manager: 1, status: 1 });

// Virtual for project duration in days
ProjectSchema.virtual("duration_days").get(function (this: IProject) {
  const diffTime = Math.abs(
    this.end_date.getTime() - this.start_date.getTime()
  );
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for checking if project is overdue
ProjectSchema.virtual("is_overdue").get(function (this: IProject) {
  const today = new Date();
  return this.status === ProjectStatus.ACTIVE && today > this.end_date;
});

// Virtual for project summary
ProjectSchema.virtual("project_summary").get(function (this: IProject) {
  return `${this.name} (${this.status}) - Managed by ${this.manager}`;
});

// Middleware to update updated_at timestamp on save
ProjectSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
