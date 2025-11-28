// app/api/cloud-backups/route.ts
import connectDB from "@/lib/db";
import CloudBackup, { BackupStatus } from "@/lib/models/CloudBackup";
import { NextRequest, NextResponse } from "next/server";

// GET all cloud backups with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const client = searchParams.get("client");

    // Build filter object
    const filter: any = {};

    if (
      status &&
      Object.values(BackupStatus).includes(status as BackupStatus)
    ) {
      filter.status = status;
    }

    if (client) {
      filter.client = new RegExp(client, "i");
    }

    const cloudBackups = await CloudBackup.find(filter)
      .sort({ lastBackup: -1, created_at: -1 })
      .select("-__v");

    // Calculate statistics
    const totalBackups = cloudBackups.length;
    const totalSize = cloudBackups.reduce(
      (sum, backup) => sum + backup.sizeGB,
      0
    );
    const successCount = cloudBackups.filter(
      (backup) => backup.status === BackupStatus.SUCCESS
    ).length;
    const failedCount = cloudBackups.filter(
      (backup) => backup.status === BackupStatus.FAILED
    ).length;
    const inProgressCount = cloudBackups.filter(
      (backup) => backup.status === BackupStatus.IN_PROGRESS
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: cloudBackups,
        statistics: {
          totalBackups,
          totalSize,
          successCount,
          failedCount,
          inProgressCount,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching cloud backups:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// CREATE new cloud backup
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const { client, package: packageName, status, sizeGB } = body;

    // Required field validation
    if (!client || !packageName || !sizeGB) {
      return NextResponse.json(
        {
          success: false,
          error: "Client, package, and size are required",
        },
        { status: 400 }
      );
    }

    // Validate size
    if (sizeGB < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Size cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(BackupStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Create backup description
    const backedUpContent = `Backup for ${client}'s ${packageName}`;

    // Create new cloud backup
    const cloudBackup = await CloudBackup.create({
      client,
      package: packageName,
      status: status || BackupStatus.IN_PROGRESS,
      sizeGB,
      backedUpContent,
      lastBackup: new Date(),
    });

    // Return without internal fields
    const backupResponse = cloudBackup.toObject();
    delete backupResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Cloud backup initiated successfully",
        data: backupResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating cloud backup:", err);

    // Handle mongoose validation errors
    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error: " + err.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// UPDATE cloud backup
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloud backup ID is required",
        },
        { status: 400 }
      );
    }

    // Check if cloud backup exists
    const existingBackup = await CloudBackup.findById(id);
    if (!existingBackup) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloud backup not found",
        },
        { status: 404 }
      );
    }

    // Validate size if provided
    if (updateData.sizeGB !== undefined && updateData.sizeGB < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Size cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (
      updateData.status &&
      !Object.values(BackupStatus).includes(updateData.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Update lastBackup if status is changing to success
    if (updateData.status === BackupStatus.SUCCESS) {
      updateData.lastBackup = new Date();
    }

    // Update cloud backup
    const updatedBackup = await CloudBackup.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }).select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Cloud backup updated successfully",
        data: updatedBackup,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating cloud backup:", err);

    // Handle mongoose validation errors
    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error: " + err.message,
        },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cloud backup ID format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE cloud backup
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloud backup ID is required",
        },
        { status: 400 }
      );
    }

    // Check if cloud backup exists
    const existingBackup = await CloudBackup.findById(id);
    if (!existingBackup) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloud backup not found",
        },
        { status: 404 }
      );
    }

    // Delete cloud backup
    await CloudBackup.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Cloud backup deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting cloud backup:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cloud backup ID format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
