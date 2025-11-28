// app/api/staff-members/route.ts
import connectDB from "@/lib/db";
import StaffMember from "@/lib/models/StaffMember";
import { NextRequest, NextResponse } from "next/server";

// GET all staff members
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const staffMembers = await StaffMember.find({})
      .sort({ created_at: -1 })
      .select("-__v");

    return NextResponse.json({ data: staffMembers }, { status: 200 });
  } catch (err) {
    console.error("Error fetching staff members:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE new staff member
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const { name, position, department, email, phone, avatar_url } = body;

    // Required field validation
    if (!name || !position || !department || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, position, department, and email are required",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStaff = await StaffMember.findOne({ email });
    if (existingStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member with this email already exists",
        },
        { status: 409 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    // Create new staff member
    const staffMember = await StaffMember.create({
      name,
      position,
      department,
      email,
      phone,
      avatar_url,
    });

    // Return without sensitive/internal fields
    const staffResponse = staffMember.toObject();
    delete staffResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Staff member created successfully",
        data: staffResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating staff member:", err);

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

// UPDATE staff member
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
          error: "Staff member ID is required",
        },
        { status: 400 }
      );
    }

    // Check if staff member exists
    const existingStaff = await StaffMember.findById(id);
    if (!existingStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member not found",
        },
        { status: 404 }
      );
    }

    // If updating email, check for duplicates
    if (updateData.email && updateData.email !== existingStaff.email) {
      const emailExists = await StaffMember.findOne({
        email: updateData.email,
        _id: { $ne: id }, // Exclude current staff member
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Email already taken by another staff member",
          },
          { status: 409 }
        );
      }

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide a valid email address",
          },
          { status: 400 }
        );
      }
    }

    // Update staff member
    const updatedStaff = await StaffMember.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }).select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Staff member updated successfully",
        data: updatedStaff,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating staff member:", err);

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
          error: "Invalid staff member ID format",
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
// DELETE staff member - Using URL parameter
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // Get ID from URL search params
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member ID is required",
        },
        { status: 400 }
      );
    }

    // Check if staff member exists
    const existingStaff = await StaffMember.findById(id);
    if (!existingStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member not found",
        },
        { status: 404 }
      );
    }

    // Delete staff member
    await StaffMember.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Staff member deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting staff member:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid staff member ID format",
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
