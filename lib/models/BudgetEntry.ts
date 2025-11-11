// models/BudgetEntry.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBudgetEntry extends Document {
  category: string;
  amount: number;
  month: string;
  year: number;
  created_at: Date;
  updated_at: Date;
}

const BudgetEntrySchema = new Schema<IBudgetEntry>(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      enum: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [2100, "Year must be 2100 or earlier"],
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
BudgetEntrySchema.index({ month: 1, year: 1 });
BudgetEntrySchema.index({ category: 1 });

// Virtual for formatted amount
BudgetEntrySchema.virtual("formatted_amount").get(function (
  this: IBudgetEntry
) {
  return this.amount.toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR",
  });
});

// Virtual for month-year combination
BudgetEntrySchema.virtual("month_year").get(function (this: IBudgetEntry) {
  return `${this.month} ${this.year}`;
});

export default mongoose.models.BudgetEntry ||
  mongoose.model<IBudgetEntry>("BudgetEntry", BudgetEntrySchema);
