// models/Contract.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ContractStatus } from "../constants/ContractConstants";

export interface IContract extends Document {
  title: string;
  counterparty: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  value: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    counterparty: {
      type: String,
      required: [true, "Counterparty is required"],
      trim: true,
      maxlength: [200, "Counterparty name cannot exceed 200 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.PENDING,
      required: true,
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
      min: [0, "Value cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index for better query performance
ContractSchema.index({ status: 1 });
ContractSchema.index({ counterparty: 1 });
ContractSchema.index({ startDate: 1, endDate: 1 });
ContractSchema.index({ created_at: -1 });

// Virtual for formatted value
ContractSchema.virtual("formatted_value").get(function (this: IContract) {
  return this.value.toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR",
  });
});

// Virtual for formatted dates
ContractSchema.virtual("formatted_start_date").get(function (this: IContract) {
  return this.startDate.toISOString().split("T")[0];
});

ContractSchema.virtual("formatted_end_date").get(function (this: IContract) {
  return this.endDate.toISOString().split("T")[0];
});

// Virtual for contract duration in days
ContractSchema.virtual("duration_days").get(function (this: IContract) {
  const diffTime = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Middleware to validate dates before save
ContractSchema.pre<IContract>("save", function (next) {
  if (this.endDate < this.startDate) {
    return next(new Error("End date must be after start date"));
  }
  next();
});

export default mongoose.models.Contract ||
  mongoose.model<IContract>("Contract", ContractSchema);
