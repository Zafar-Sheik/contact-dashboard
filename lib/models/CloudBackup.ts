// models/CloudBackup.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export enum BackupStatus {
  SUCCESS = "Success",
  FAILED = "Failed",
  IN_PROGRESS = "In Progress",
}

export interface ICloudBackup extends Document {
  client: string;
  package: string;
  status: BackupStatus;
  sizeGB: number;
  lastBackup: Date;
  backedUpContent: string;
  created_at: Date;
  updated_at: Date;
}

const CloudBackupSchema = new Schema<ICloudBackup>(
  {
    client: {
      type: String,
      required: [true, "Client is required"],
      trim: true,
      maxlength: [100, "Client name cannot exceed 100 characters"],
    },
    package: {
      type: String,
      required: [true, "Package is required"],
      trim: true,
      maxlength: [100, "Package name cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: Object.values(BackupStatus),
      default: BackupStatus.IN_PROGRESS,
      required: true,
    },
    sizeGB: {
      type: Number,
      required: [true, "Size is required"],
      min: [0, "Size cannot be negative"],
    },
    lastBackup: {
      type: Date,
      default: Date.now,
      required: true,
    },
    backedUpContent: {
      type: String,
      required: [true, "Backup content description is required"],
      trim: true,
      maxlength: [500, "Backup content cannot exceed 500 characters"],
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
CloudBackupSchema.index({ client: 1 });
CloudBackupSchema.index({ status: 1 });
CloudBackupSchema.index({ lastBackup: -1 });

// Virtual for formatted last backup date
CloudBackupSchema.virtual("formatted_last_backup").get(function (
  this: ICloudBackup
) {
  return this.lastBackup.toLocaleString();
});

// Virtual for backup description
CloudBackupSchema.virtual("backup_description").get(function (
  this: ICloudBackup
) {
  return `Backup for ${this.client}'s ${this.package}`;
});

export default mongoose.models.CloudBackup ||
  mongoose.model<ICloudBackup>("CloudBackup", CloudBackupSchema);
