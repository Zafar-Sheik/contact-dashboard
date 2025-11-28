// app/api/budget-tracker/route.ts
import connectDB from "@/lib/db";
import BudgetEntry from "@/lib/models/BudgetEntry";
import { NextRequest, NextResponse } from "next/server";

// GET all budget entries with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const category = searchParams.get("category");

    // Build filter object
    const filter: any = {};

    if (month) {
      filter.month = month;
    }

    if (year) {
      filter.year = parseInt(year);
    }

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    const budgetEntries = await BudgetEntry.find(filter)
      .sort({ year: -1, month: -1, created_at: -1 })
      .select("-__v");

    // Calculate total amount
    const totalAmount = budgetEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    return NextResponse.json(
      {
        success: true,
        data: budgetEntries,
        totalAmount,
        count: budgetEntries.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching budget entries:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// CREATE new budget entry
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const { category, amount, month, year } = body;

    // Required field validation
    if (!category || !amount || !month || !year) {
      return NextResponse.json(
        {
          success: false,
          error: "Category, amount, month, and year are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate month
    const validMonths = [
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
    ];
    if (!validMonths.includes(month)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid month",
        },
        { status: 400 }
      );
    }

    // Validate year
    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: "Year must be between 2000 and 2100",
        },
        { status: 400 }
      );
    }

    // Create new budget entry
    const budgetEntry = await BudgetEntry.create({
      category,
      amount,
      month,
      year,
    });

    // Return without internal fields
    const entryResponse = budgetEntry.toObject();
    delete entryResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Budget entry created successfully",
        data: entryResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating budget entry:", err);

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

// UPDATE budget entry
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
          error: "Budget entry ID is required",
        },
        { status: 400 }
      );
    }

    // Check if budget entry exists
    const existingEntry = await BudgetEntry.findById(id);
    if (!existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget entry not found",
        },
        { status: 404 }
      );
    }

    // Validate amount if provided
    if (updateData.amount !== undefined && updateData.amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount cannot be negative",
        },
        { status: 400 }
      );
    }

    // Update budget entry
    const updatedEntry = await BudgetEntry.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }).select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Budget entry updated successfully",
        data: updatedEntry,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating budget entry:", err);

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
          error: "Invalid budget entry ID format",
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

// DELETE budget entry
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
          error: "Budget entry ID is required",
        },
        { status: 400 }
      );
    }

    // Check if budget entry exists
    const existingEntry = await BudgetEntry.findById(id);
    if (!existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: "Budget entry not found",
        },
        { status: 404 }
      );
    }

    // Delete budget entry
    await BudgetEntry.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Budget entry deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting budget entry:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid budget entry ID format",
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
