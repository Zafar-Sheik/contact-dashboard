// app/api/tasks/route.ts
import connectDB from "@/lib/db";
import Task from "@/lib/models/Task";
import StaffMember from "@/lib/models/StaffMember";
import { TaskStatus } from "@/lib/constants/TaskContants";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];

// GET all tasks with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee");
    const overdue = searchParams.get("overdue");
    const timeRange = searchParams.get("time_range");

    // Build filter object
    const filter: any = {};

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      filter.status = status;
    }

    if (assignee) {
      filter.assignee = assignee;
    }

    if (overdue === "true") {
      filter.due_date = { $lt: new Date() };
      filter.status = { $ne: TaskStatus.DONE };
    }

    // Time-based filtering
    if (timeRange) {
      switch (timeRange) {
        case "under_estimated":
          filter.$expr = { $lt: ["$actual_hours", "$estimated_hours"] };
          break;
        case "over_estimated":
          filter.$expr = { $gt: ["$actual_hours", "$estimated_hours"] };
          break;
        case "completed":
          filter.$expr = { $eq: ["$actual_hours", "$estimated_hours"] };
          break;
        case "no_time":
          filter.estimated_hours = { $exists: false };
          break;
      }
    }

    const tasks = await Task.find(filter)
      .populate("assignee", "name email position department")
      .sort({ due_date: 1, created_at: -1 })
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        data: tasks,
        count: tasks.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// CREATE new task (with optional file upload)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get("content-type") || "";

    // Handle form data (with files)
    if (contentType.includes("multipart/form-data")) {
      return await handleFormDataRequest(req);
    }

    // Handle JSON data (without files)
    return await handleJsonRequest(req);
  } catch (err) {
    console.error("Error creating task:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to handle JSON requests (without files)
async function handleJsonRequest(req: NextRequest) {
  const body = await req.json();

  const {
    title,
    description,
    assignee,
    due_date,
    due_time,
    estimated_hours,
    actual_hours,
    status,
    attachments,
  } = body;

  // Required field validation
  if (!title || !assignee || !due_date) {
    return NextResponse.json(
      {
        success: false,
        error: "Title, assignee, and due date are required",
      },
      { status: 400 }
    );
  }

  // Validate due date
  const dueDate = new Date(due_date);

  // Validate due time format if provided
  if (due_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(due_time)) {
    return NextResponse.json(
      {
        success: false,
        error: "Due time must be in HH:MM format (24-hour)",
      },
      { status: 400 }
    );
  }

  // Validate status if provided
  if (status && !Object.values(TaskStatus).includes(status)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid status value",
      },
      { status: 400 }
    );
  }

  // Validate time fields
  if (estimated_hours && (estimated_hours < 0 || estimated_hours > 1000)) {
    return NextResponse.json(
      {
        success: false,
        error: "Estimated hours must be between 0 and 1000",
      },
      { status: 400 }
    );
  }

  if (actual_hours && (actual_hours < 0 || actual_hours > 1000)) {
    return NextResponse.json(
      {
        success: false,
        error: "Actual hours must be between 0 and 1000",
      },
      { status: 400 }
    );
  }

  // Validate assignee exists
  const staffMemberExists = await StaffMember.findById(assignee);
  if (!staffMemberExists) {
    return NextResponse.json(
      {
        success: false,
        error: "Assignee staff member not found",
      },
      { status: 400 }
    );
  }

  // Validate attachments if provided
  if (attachments && Array.isArray(attachments)) {
    for (const attachment of attachments) {
      if (!attachment.filename || !attachment.path) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid attachment data",
          },
          { status: 400 }
        );
      }
    }
  }

  // Create new task
  const task = await Task.create({
    title,
    description,
    assignee,
    due_date: dueDate,
    due_time: due_time || undefined,
    estimated_hours: estimated_hours || undefined,
    actual_hours: actual_hours || undefined,
    status: status || TaskStatus.TODO,
    attachments: attachments || [],
  });

  // Populate the assignee field for response
  await task.populate("assignee", "name email position department");

  // Return without internal fields
  const taskResponse = task.toObject();
  delete taskResponse.__v;

  return NextResponse.json(
    {
      success: true,
      message: "Task created successfully",
      data: taskResponse,
    },
    { status: 201 }
  );
}

// Helper function to handle form data requests (with files)
async function handleFormDataRequest(req: NextRequest) {
  const formData = await req.formData();

  // Extract text fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assignee = formData.get("assignee") as string;
  const due_date = formData.get("due_date") as string;
  const due_time = formData.get("due_time") as string;
  const estimated_hours = formData.get("estimated_hours") as string;
  const actual_hours = formData.get("actual_hours") as string;
  const status = formData.get("status") as string;

  // Required field validation
  if (!title || !assignee || !due_date) {
    return NextResponse.json(
      {
        success: false,
        error: "Title, assignee, and due date are required",
      },
      { status: 400 }
    );
  }

  // Validate due date
  const dueDate = new Date(due_date);

  // Validate due time format if provided
  if (due_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(due_time)) {
    return NextResponse.json(
      {
        success: false,
        error: "Due time must be in HH:MM format (24-hour)",
      },
      { status: 400 }
    );
  }

  // Validate status if provided
  if (status && !Object.values(TaskStatus).includes(status as TaskStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid status value",
      },
      { status: 400 }
    );
  }

  // Validate time fields
  const estimatedHoursNum = estimated_hours
    ? parseFloat(estimated_hours)
    : undefined;
  const actualHoursNum = actual_hours ? parseFloat(actual_hours) : undefined;

  if (
    estimatedHoursNum &&
    (estimatedHoursNum < 0 || estimatedHoursNum > 1000)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Estimated hours must be between 0 and 1000",
      },
      { status: 400 }
    );
  }

  if (actualHoursNum && (actualHoursNum < 0 || actualHoursNum > 1000)) {
    return NextResponse.json(
      {
        success: false,
        error: "Actual hours must be between 0 and 1000",
      },
      { status: 400 }
    );
  }

  // Validate assignee exists
  const staffMemberExists = await StaffMember.findById(assignee);
  if (!staffMemberExists) {
    return NextResponse.json(
      {
        success: false,
        error: "Assignee staff member not found",
      },
      { status: 400 }
    );
  }

  // Handle file uploads
  const attachments = [];
  const files = formData.getAll("attachments") as File[];

  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const attachment = await saveUploadedFile(file);
        attachments.push(attachment);
      } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to upload file: ${(error as Error).message}`,
          },
          { status: 400 }
        );
      }
    }
  }

  // Create new task with attachments
  const task = await Task.create({
    title,
    description,
    assignee,
    due_date: dueDate,
    due_time: due_time || undefined,
    estimated_hours: estimatedHoursNum,
    actual_hours: actualHoursNum,
    status: status || TaskStatus.TODO,
    attachments,
  });

  // Populate the assignee field for response
  await task.populate("assignee", "name email position department");

  // Return without internal fields
  const taskResponse = task.toObject();
  delete taskResponse.__v;

  return NextResponse.json(
    {
      success: true,
      message: "Task created successfully",
      data: taskResponse,
    },
    { status: 201 }
  );
}

// Helper function to save uploaded files
async function saveUploadedFile(file: File): Promise<any> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      `File type ${
        file.type
      } is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    );
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads", "tasks");
  await mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const fileExtension = path.extname(file.name);
  const uniqueFilename = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFilename);

  // Save file to disk
  await writeFile(filePath, buffer);

  return {
    filename: uniqueFilename,
    original_name: file.name,
    mime_type: file.type,
    size: file.size,
    upload_date: new Date(),
    path: filePath,
  };
}

// UPDATE task (with optional file upload)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get("content-type") || "";

    // Handle form data (with files)
    if (contentType.includes("multipart/form-data")) {
      return await handleUpdateFormDataRequest(req);
    }

    // Handle JSON data (without files)
    return await handleUpdateJsonRequest(req);
  } catch (err) {
    console.error("Error updating task:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to handle JSON update requests
async function handleUpdateJsonRequest(req: NextRequest) {
  const body = await req.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "Task ID is required",
      },
      { status: 400 }
    );
  }

  // Check if task exists
  const existingTask = await Task.findById(id);
  if (!existingTask) {
    return NextResponse.json(
      {
        success: false,
        error: "Task not found",
      },
      { status: 404 }
    );
  }

  // Validate due date if provided
  if (updateData.due_date) {
    const dueDate = new Date(updateData.due_date);
    updateData.due_date = dueDate;
  }

  // Validate due time format if provided
  if (
    updateData.due_time &&
    !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.due_time)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Due time must be in HH:MM format (24-hour)",
      },
      { status: 400 }
    );
  }

  // Validate status if provided
  if (
    updateData.status &&
    !Object.values(TaskStatus).includes(updateData.status)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid status value",
      },
      { status: 400 }
    );
  }

  // Validate time fields
  if (updateData.estimated_hours !== undefined) {
    const estimatedHours = parseFloat(updateData.estimated_hours);
    if (estimatedHours < 0 || estimatedHours > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Estimated hours must be between 0 and 1000",
        },
        { status: 400 }
      );
    }
    updateData.estimated_hours = estimatedHours;
  }

  if (updateData.actual_hours !== undefined) {
    const actualHours = parseFloat(updateData.actual_hours);
    if (actualHours < 0 || actualHours > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Actual hours must be between 0 and 1000",
        },
        { status: 400 }
      );
    }
    updateData.actual_hours = actualHours;
  }

  // Validate assignee exists if provided
  if (updateData.assignee) {
    const staffMemberExists = await StaffMember.findById(updateData.assignee);
    if (!staffMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Assignee staff member not found",
        },
        { status: 400 }
      );
    }
  }

  // Validate attachments if provided
  if (updateData.attachments && Array.isArray(updateData.attachments)) {
    for (const attachment of updateData.attachments) {
      if (!attachment.filename || !attachment.path) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid attachment data",
          },
          { status: 400 }
        );
      }
    }
  }

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("assignee", "name email position department")
    .select("-__v");

  return NextResponse.json(
    {
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    },
    { status: 200 }
  );
}

// Helper function to handle form data update requests
async function handleUpdateFormDataRequest(req: NextRequest) {
  const formData = await req.formData();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assignee = formData.get("assignee") as string;
  const due_date = formData.get("due_date") as string;
  const due_time = formData.get("due_time") as string;
  const estimated_hours = formData.get("estimated_hours") as string;
  const actual_hours = formData.get("actual_hours") as string;
  const status = formData.get("status") as string;
  const remove_attachments = formData.get("remove_attachments") as string;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "Task ID is required",
      },
      { status: 400 }
    );
  }

  // Check if task exists
  const existingTask = await Task.findById(id);
  if (!existingTask) {
    return NextResponse.json(
      {
        success: false,
        error: "Task not found",
      },
      { status: 404 }
    );
  }

  // Build update data
  const updateData: any = {};

  if (title) updateData.title = title;
  if (description !== null) updateData.description = description;
  if (assignee) updateData.assignee = assignee;
  if (due_date) updateData.due_date = new Date(due_date);
  if (due_time !== null) updateData.due_time = due_time || undefined;
  if (status) updateData.status = status;

  // Handle time fields
  if (estimated_hours !== null) {
    updateData.estimated_hours = estimated_hours
      ? parseFloat(estimated_hours)
      : undefined;
  }

  if (actual_hours !== null) {
    updateData.actual_hours = actual_hours
      ? parseFloat(actual_hours)
      : undefined;
  }

  // Validate assignee exists if provided
  if (assignee) {
    const staffMemberExists = await StaffMember.findById(assignee);
    if (!staffMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Assignee staff member not found",
        },
        { status: 400 }
      );
    }
  }

  // Handle file uploads
  const newAttachments = [];
  const files = formData.getAll("attachments") as File[];

  for (const file of files) {
    if (file && file.size > 0) {
      try {
        const attachment = await saveUploadedFile(file);
        newAttachments.push(attachment);
      } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to upload file: ${(error as Error).message}`,
          },
          { status: 400 }
        );
      }
    }
  }

  // Handle attachment removal
  const attachmentsToRemove: string[] = [];
  if (remove_attachments) {
    const filenamesToRemove = remove_attachments.split(",");
    updateData.$pull = {
      attachments: { filename: { $in: filenamesToRemove } },
    };
    attachmentsToRemove.push(...filenamesToRemove);
  }

  // Add new attachments if any
  if (newAttachments.length > 0) {
    updateData.$push = { attachments: { $each: newAttachments } };
  }

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("assignee", "name email position department")
    .select("-__v");

  // Clean up removed attachment files
  if (attachmentsToRemove.length > 0) {
    for (const filename of attachmentsToRemove) {
      const attachment = existingTask.attachments.find(
        (att: any) => att.filename === filename
      );
      if (attachment) {
        try {
          await unlink(attachment.path);
        } catch (error) {
          console.error(`Error deleting file ${attachment.path}:`, error);
        }
      }
    }
  }

  return NextResponse.json(
    {
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    },
    { status: 200 }
  );
}

// DELETE task
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
          error: "Task ID is required",
        },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    // Delete associated files
    if (existingTask.attachments && existingTask.attachments.length > 0) {
      for (const attachment of existingTask.attachments) {
        try {
          await unlink(attachment.path);
        } catch (error) {
          console.error(`Error deleting file ${attachment.path}:`, error);
        }
      }
    }

    // Delete task
    await Task.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Task deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting task:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid task ID format",
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

// NEW ENDPOINT: Add time entry to task
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { taskId, hours, type } = body; // type: 'estimated' or 'actual'

    if (!taskId || hours === undefined || !type) {
      return NextResponse.json(
        {
          success: false,
          error: "Task ID, hours, and type are required",
        },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    // Validate hours
    const hoursNum = parseFloat(hours);
    if (hoursNum < 0 || hoursNum > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Hours must be between 0 and 1000",
        },
        { status: 400 }
      );
    }

    // Update time based on type
    const updateData: any = {};
    if (type === "estimated") {
      updateData.estimated_hours = hoursNum;
    } else if (type === "actual") {
      updateData.actual_hours = hoursNum;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Type must be 'estimated' or 'actual'",
        },
        { status: 400 }
      );
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignee", "name email position department")
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Time updated successfully",
        data: updatedTask,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating time:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// NEW ENDPOINT: Download file
export async function GET_FILE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const taskId = searchParams.get("taskId");

    if (!filename || !taskId) {
      return NextResponse.json(
        { success: false, error: "Filename and taskId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the task exists and has this attachment
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const attachment = task.attachments.find(
      (att: any) => att.filename === filename
    );

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(attachment.path)) {
      return NextResponse.json(
        { success: false, error: "File not found on server" },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fileBuffer = await readFile(attachment.path);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": attachment.mime_type,
        "Content-Disposition": `inline; filename="${attachment.original_name}"`,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (err) {
    console.error("Error serving file:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// NEW ENDPOINT: Delete specific file from task
export async function DELETE_FILE(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { taskId, filename } = body;

    if (!taskId || !filename) {
      return NextResponse.json(
        { success: false, error: "Task ID and filename are required" },
        { status: 400 }
      );
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Find the attachment
    const attachment = task.attachments.find(
      (att: any) => att.filename === filename
    );

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "File not found in task" },
        { status: 404 }
      );
    }

    // Delete the file from filesystem
    try {
      await unlink(attachment.path);
    } catch (error) {
      console.error(`Error deleting file ${attachment.path}:`, error);
    }

    // Remove the attachment from the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { attachments: { filename } } },
      { new: true }
    ).populate("assignee", "name email position department");

    return NextResponse.json(
      {
        success: true,
        message: "File deleted successfully",
        data: updatedTask,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting file:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// NEW ENDPOINT: Upload files to existing task
export async function PUT_FILES(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const taskId = formData.get("taskId") as string;

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Task ID is required",
        },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    // Handle file uploads
    const newAttachments = [];
    const files = formData.getAll("attachments") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No files provided",
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const attachment = await saveUploadedFile(file);
          newAttachments.push(attachment);
        } catch (error) {
          console.error("Error saving file:", error);
          return NextResponse.json(
            {
              success: false,
              error: `Failed to upload file: ${(error as Error).message}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Add attachments to task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $push: { attachments: { $each: newAttachments } },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("assignee", "name email position department")
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Files uploaded successfully",
        data: updatedTask,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error adding attachments:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
