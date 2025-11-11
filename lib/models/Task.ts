// models/Task.ts (Simplified version without middleware)
import mongoose, { Schema, Document, Types } from "mongoose";
import { TaskStatus } from "../constants/TaskContants";

export interface ITask extends Document {
  title: string;
  description?: string;
  assignee: Types.ObjectId;
  due_date: Date;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
}

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

    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      required: true,
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

// Virtuals
TaskSchema.virtual("formatted_due_date").get(function (this: ITask) {
  return this.due_date.toLocaleDateString();
});

TaskSchema.virtual("is_overdue").get(function (this: ITask) {
  return this.due_date < new Date() && this.status !== TaskStatus.DONE;
});

TaskSchema.virtual("days_until_due").get(function (this: ITask) {
  const today = new Date();
  const due = this.due_date;
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);
