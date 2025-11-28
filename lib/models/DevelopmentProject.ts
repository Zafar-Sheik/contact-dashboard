// models/DevelopmentProject.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ProjectStatus } from "../constants/ProjectConstants";

export interface IDevelopmentProject extends Document {
  name: string;
  description?: string;
  lead: Types.ObjectId;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date;
  budget?: number;
  technologies?: string[];
  repositoryUrl?: string;
  created_at: Date;
  updated_at: Date;
}

const DevelopmentProjectSchema = new Schema<IDevelopmentProject>(
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
    lead: {
      type: Schema.Types.ObjectId,
      ref: "StaffMember",
      required: [true, "Project lead is required"],
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.NOT_STARTED,
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    repositoryUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          return /^https?:\/\/.+\..+/.test(v);
        },
        message: "Please provide a valid URL",
      },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes for better query performance
DevelopmentProjectSchema.index({ name: 1 });
DevelopmentProjectSchema.index({ status: 1 });
DevelopmentProjectSchema.index({ lead: 1 });
DevelopmentProjectSchema.index({ startDate: -1 });
DevelopmentProjectSchema.index({ endDate: -1 });
DevelopmentProjectSchema.index({ technologies: 1 });

// Compound indexes
DevelopmentProjectSchema.index({ status: 1, startDate: -1 });
DevelopmentProjectSchema.index({ lead: 1, status: 1 });

// Virtual for project duration in days
DevelopmentProjectSchema.virtual("duration_days").get(function (
  this: IDevelopmentProject
) {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for checking if project is overdue
DevelopmentProjectSchema.virtual("is_overdue").get(function (
  this: IDevelopmentProject
) {
  const today = new Date();
  return this.status === ProjectStatus.ACTIVE && today > this.endDate;
});

// Virtual for project summary
DevelopmentProjectSchema.virtual("project_summary").get(function (
  this: IDevelopmentProject
) {
  return `${this.name} (${this.status}) - Led by ${this.lead}`;
});

// Middleware to update updated_at timestamp on save
DevelopmentProjectSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.DevelopmentProject ||
  mongoose.model<IDevelopmentProject>(
    "DevelopmentProject",
    DevelopmentProjectSchema
  );
