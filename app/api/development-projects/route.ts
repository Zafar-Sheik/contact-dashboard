// app/api/development-projects/route.ts
import connectDB from "@/lib/db";
import DevelopmentProject from "@/lib/models/DevelopmentProject";
import { ProjectStatus } from "@/lib/constants/ProjectConstants";
import { NextRequest, NextResponse } from "next/server";

// GET all development projects with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const lead = searchParams.get("lead");
    const name = searchParams.get("name");
    const technology = searchParams.get("technology");

    // Build filter object
    const filter: any = {};

    if (
      status &&
      Object.values(ProjectStatus).includes(status as ProjectStatus)
    ) {
      filter.status = status;
    }

    if (lead) {
      filter.lead = lead;
    }

    if (name) {
      filter.name = new RegExp(name, "i");
    }

    if (technology) {
      filter.technologies = { $in: [new RegExp(technology, "i")] };
    }

    const projects = await DevelopmentProject.find(filter)
      .populate("lead", "name email position") // Populate lead details
      .sort({ created_at: -1, startDate: -1 })
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
        project.status === ProjectStatus.ACTIVE && project.endDate < today
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
    console.error("Error fetching development projects:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// CREATE new development project
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const {
      name,
      description,
      lead,
      status,
      budget,
      startDate,
      endDate,
      technologies,
      repositoryUrl,
    } = body;

    // Required field validation
    if (!name || !lead || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, lead, start date, and end date are required",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

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

    // Create new development project
    const project = await DevelopmentProject.create({
      name,
      description,
      lead,
      status: status || ProjectStatus.NOT_STARTED,
      budget,
      startDate: startDateObj,
      endDate: endDateObj,
      technologies: technologies || [],
      repositoryUrl,
    });

    // Populate lead details in response
    await project.populate("lead", "name email position");

    // Return without internal fields
    const projectResponse = project.toObject();
    delete projectResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Development project created successfully",
        data: projectResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating development project:", err);

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

    // Handle cast errors (invalid ObjectId for lead)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead ID format",
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

// UPDATE development project
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
    const existingProject = await DevelopmentProject.findById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: "Development project not found",
        },
        { status: 404 }
      );
    }

    // Removed: Date validation logic
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate
        ? new Date(updateData.startDate)
        : existingProject.startDate;
      const endDate = updateData.endDate
        ? new Date(updateData.endDate)
        : existingProject.endDate;
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
    const updatedProject = await DevelopmentProject.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }
    )
      .populate("lead", "name email position")
      .select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Development project updated successfully",
        data: updatedProject,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating development project:", err);

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

// DELETE development project
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
    const existingProject = await DevelopmentProject.findById(id);
    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: "Development project not found",
        },
        { status: 404 }
      );
    }

    // Delete project
    await DevelopmentProject.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Development project deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting development project:", err);

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