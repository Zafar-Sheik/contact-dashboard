// models/Task.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { TaskStatus } from "../constants/TaskContants";

export interface IFileAttachment {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  upload_date: Date;
  path: string;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  assignee: Types.ObjectId;
  due_date: Date;
  due_time?: string; // New field for time
  estimated_hours?: number; // New field for time estimation
  actual_hours?: number; // New field for actual time spent
  status: TaskStatus;
  attachments: IFileAttachment[];
  created_at: Date;
  updated_at: Date;
}

const FileAttachmentSchema = new Schema<IFileAttachment>(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    original_name: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    mime_type: {
      type: String,
      required: [true, "MIME type is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    upload_date: {
      type: Date,
      default: Date.now,
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
  },
  {
    _id: true,
  }
);

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [255, "Title cannot exceed 255 characters"],
    },

    description: {
      type: String,
      trim: true,
    },

    assignee: {
      type: Schema.Types.ObjectId,
      ref: "StaffMember",
      required: [true, "Assignee is required"],
    },

    due_date: {
      type: Date,
      required: [true, "Due date is required"],
    },

    due_time: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:MM format
        },
        message: "Due time must be in HH:MM format (24-hour)",
      },
    },

    estimated_hours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
      max: [1000, "Estimated hours cannot exceed 1000"],
    },

    actual_hours: {
      type: Number,
      min: [0, "Actual hours cannot be negative"],
      max: [1000, "Actual hours cannot exceed 1000"],
    },

    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      required: true,
    },

    attachments: {
      type: [FileAttachmentSchema],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ due_date: 1 });
TaskSchema.index({ created_at: -1 });
TaskSchema.index({ "attachments.upload_date": -1 });
TaskSchema.index({ estimated_hours: 1 });
TaskSchema.index({ actual_hours: 1 });

// Virtuals
TaskSchema.virtual("formatted_due_date").get(function (this: ITask) {
  return this.due_date.toLocaleDateString();
});

TaskSchema.virtual("formatted_due_datetime").get(function (this: ITask) {
  const dateStr = this.due_date.toLocaleDateString();
  return this.due_time ? `${dateStr} at ${this.due_time}` : dateStr;
});

TaskSchema.virtual("is_overdue").get(function (this: ITask) {
  const now = new Date();
  const due = new Date(this.due_date);

  if (this.due_time) {
    const [hours, minutes] = this.due_time.split(":").map(Number);
    due.setHours(hours, minutes, 0, 0);
  }

  return due < now && this.status !== TaskStatus.DONE;
});

TaskSchema.virtual("days_until_due").get(function (this: ITask) {
  const today = new Date();
  const due = new Date(this.due_date);

  if (this.due_time) {
    const [hours, minutes] = this.due_time.split(":").map(Number);
    due.setHours(hours, minutes, 0, 0);
  }

  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for time remaining percentage
TaskSchema.virtual("time_remaining_percentage").get(function (this: ITask) {
  if (!this.estimated_hours || !this.actual_hours) return null;
  if (this.estimated_hours === 0) return 0;

  const remaining = Math.max(0, this.estimated_hours - this.actual_hours);
  return (remaining / this.estimated_hours) * 100;
});

// Virtual for time usage percentage
TaskSchema.virtual("time_usage_percentage").get(function (this: ITask) {
  if (!this.estimated_hours || !this.actual_hours) return null;
  if (this.estimated_hours === 0) return 100;

  return Math.min(100, (this.actual_hours / this.estimated_hours) * 100);
});

// Instance methods for time management
TaskSchema.methods.addTimeEntry = function (hours: number) {
  this.actual_hours = (this.actual_hours || 0) + hours;
  return this.save();
};

TaskSchema.methods.updateEstimatedTime = function (hours: number) {
  this.estimated_hours = hours;
  return this.save();
};

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);
