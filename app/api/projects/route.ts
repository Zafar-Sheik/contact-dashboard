// app/api/projects/route.ts
import connectDB from "@/lib/db";
import Project from "@/lib/models/Project";
import { ProjectStatus } from "@/lib/constants/ProjectConstants";
import { NextRequest, NextResponse } from "next/server";

// Helper function to handle database connection with retry
async function ensureDatabaseConnection() {
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// GET all projects with optional filtering
export async function GET(req: NextRequest) {
  try {
    const isConnected = await ensureDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const manager = searchParams.get("manager");
    const name = searchParams.get("name");

    // Build filter object
    const filter: any = {};

    if (
      status &&
      status !== "all" &&
      Object.values(ProjectStatus).includes(status as ProjectStatus)
    ) {
      filter.status = status;
    }

    if (manager && manager !== "all") {
      filter.manager = manager;
    }

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const projects = await Project.find(filter)
      .populate("manager", "name email position department") // Populate manager details
      .sort({ created_at: -1, start_date: -1 })
      .select("-__v")
      .lean(); // Use lean for better performance

    // Calculate statistics with safe defaults
    const totalProjects = projects.length;
    const totalBudget = projects.reduce(
      (sum, project) => sum + (project.budget || 0),
      0
    );
    const activeCount = projects.filter(
      (project) => project.status === ProjectStatus.ACTIVE
    ).length;
    const completedCount = projects.filter(
      (project) => project.status === ProjectStatus.COMPLETED
    ).length;
    const notStartedCount = projects.filter(
      (project) => project.status === ProjectStatus.NOT_STARTED
    ).length;
    const onHoldCount = projects.filter(
      (project) => project.status === ProjectStatus.ON_HOLD
    ).length;
    const cancelledCount = projects.filter(
      (project) => project.status === ProjectStatus.CANCELLED
    ).length;

    // Calculate overdue projects
    const today = new Date();
    const overdueCount = projects.filter(
      (project) =>
        project.status === ProjectStatus.ACTIVE &&
        new Date(project.end_date) < today
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: projects,
        statistics: {
          totalProjects,
          totalBudget,
          activeCount,
          completedCount,
          notStartedCount,
          onHoldCount,
          cancelledCount,
          overdueCount,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching projects:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// CREATE new project
export async function POST(req: NextRequest) {
  try {
    const isConnected = await ensureDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await req.json();

    const { name, description, manager, status, budget, start_date, end_date } =
      body;

    // Required field validation
    if (!name || !manager || !start_date || !end_date) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, manager, start date, and end date are required",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // Removed: if (startDate >= endDate) validation

    // Validate status if provided
    if (status && !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Validate budget if provided
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget must be a positive number",
        },
        { status: 400 }
      );
    }

    // Create new project
    const project = await Project.create({
      name: name.trim(),
      description: description?.trim(),
      manager,
      status: status || ProjectStatus.NOT_STARTED,
      budget: budget ? parseFloat(budget) : undefined,
      start_date: startDate,
      end_date: endDate,
    });

    // Populate manager details in response
    await project.populate("manager", "name email position department");

    // Return without internal fields
    const projectResponse = project.toObject();
    delete projectResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: projectResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating project:", err);

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

    // Handle cast errors (invalid ObjectId for manager)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid manager ID format",
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (err instanceof Error && err.message.includes("E11000")) {
      return NextResponse.json(
        {
          success: false,
          error: "A project with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// UPDATE project
export async function PATCH(req: NextRequest) {
  try {
    const isConnected = await ensureDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    // Removed: Date validation logic

    // Validate status if provided
    if (
      updateData.status &&
      !Object.values(ProjectStatus).includes(updateData.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Validate budget if provided
    if (
      updateData.budget !== undefined &&
      (isNaN(updateData.budget) || updateData.budget < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget must be a positive number",
        },
        { status: 400 }
      );
    }

    // Clean update data
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description)
      updateData.description = updateData.description.trim();
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    })
      .populate("manager", "name email position department")
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating project:", err);

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
          error: "Invalid project ID format",
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (err instanceof Error && err.message.includes("E11000")) {
      return NextResponse.json(
        {
          success: false,
          error: "A project with this name already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(req: NextRequest) {
  try {
    const isConnected = await ensureDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting project:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}