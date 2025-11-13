// app/api/tasks/route.ts
import connectDB from "@/lib/db";
import Task from "@/lib/models/Task";
import StaffMember from "@/lib/models/StaffMember";
import { TaskStatus } from "@/lib/constants/TaskContants";
import { NextRequest, NextResponse } from "next/server";

// GET all tasks with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee");
    const overdue = searchParams.get("overdue");

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

// CREATE new task
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const { title, description, assignee, due_date, status } = body;

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

    // Validate due date is in the future
    const dueDate = new Date(due_date);

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

    // VALIDATE ASSIGNEE EXISTS (moved from middleware to API)
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

    // Create new task
    const task = await Task.create({
      title,
      description,
      assignee,
      due_date: dueDate,
      status: status || TaskStatus.TODO,
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
  } catch (err) {
    console.error("Error creating task:", err);

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
          error: "Invalid assignee ID format",
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

// UPDATE task
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

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
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
  } catch (err) {
    console.error("Error updating task:", err);

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
          error: "Invalid ID format",
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
