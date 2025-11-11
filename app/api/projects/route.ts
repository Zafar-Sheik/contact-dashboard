// app/api/projects/route.ts
import connectDB from "@/lib/db";
import Project from "@/lib/models/Project";
import { ProjectStatus } from "@/lib/constants/ProjectConstants";
import { NextRequest, NextResponse } from "next/server";

// GET all projects with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const manager = searchParams.get("manager");
    const name = searchParams.get("name");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter object
    const filter: any = {};

    if (
      status &&
      Object.values(ProjectStatus).includes(status as ProjectStatus)
    ) {
      filter.status = status;
    }

    if (manager) {
      filter.manager = manager;
    }

    if (name) {
      filter.name = new RegExp(name, "i");
    }

    if (startDate) {
      filter.start_date = { $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.end_date = { $lte: new Date(endDate) };
    }

    const projects = await Project.find(filter)
      .populate("manager", "name email") // Populate manager details
      .sort({ created_at: -1, start_date: -1 })
      .select("-__v");

    // Calculate statistics
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
        project.status === ProjectStatus.ACTIVE && project.end_date < today
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
      },
      { status: 500 }
    );
  }
}

// CREATE new project
export async function POST(req: NextRequest) {
  try {
    await connectDB();

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

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "End date must be after start date",
        },
        { status: 400 }
      );
    }

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
    if (budget !== undefined && budget < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget cannot be negative",
        },
        { status: 400 }
      );
    }

    // Create new project
    const project = await Project.create({
      name,
      description,
      manager,
      status: status || ProjectStatus.NOT_STARTED,
      budget,
      start_date: startDate,
      end_date: endDate,
    });

    // Populate manager details in response
    await project.populate("manager", "name email");

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

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// UPDATE project
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

    // Validate dates if provided
    if (updateData.start_date || updateData.end_date) {
      const startDate = updateData.start_date
        ? new Date(updateData.start_date)
        : existingProject.start_date;
      const endDate = updateData.end_date
        ? new Date(updateData.end_date)
        : existingProject.end_date;

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            success: false,
            error: "End date must be after start date",
          },
          { status: 400 }
        );
      }
    }

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
    if (updateData.budget !== undefined && updateData.budget < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget cannot be negative",
        },
        { status: 400 }
      );
    }

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    })
      .populate("manager", "name email")
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

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE project
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
      },
      { status: 500 }
    );
  }
}
