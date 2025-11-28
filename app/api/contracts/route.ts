// app/api/contracts/route.ts
import connectDB from "@/lib/db";
import Contract from "@/lib/models/Contract";
import { ContractStatus } from "@/lib/constants/ContractConstants";
import { NextRequest, NextResponse } from "next/server";

// GET all contracts with optional filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const counterparty = searchParams.get("counterparty");
    const activeOnly = searchParams.get("activeOnly");

    // Build filter object
    const filter: any = {};

    if (
      status &&
      Object.values(ContractStatus).includes(status as ContractStatus)
    ) {
      filter.status = status;
    }

    if (counterparty) {
      filter.counterparty = new RegExp(counterparty, "i");
    }

    if (activeOnly === "true") {
      filter.status = ContractStatus.ACTIVE;
    }

    const contracts = await Contract.find(filter)
      .sort({ created_at: -1 })
      .select("-__v");

    // Calculate statistics
    const totalContracts = contracts.length;
    const totalValue = contracts.reduce(
      (sum, contract) => sum + contract.value,
      0
    );
    const activeCount = contracts.filter(
      (contract) => contract.status === ContractStatus.ACTIVE
    ).length;
    const expiredCount = contracts.filter(
      (contract) => contract.status === ContractStatus.EXPIRED
    ).length;
    const terminatedCount = contracts.filter(
      (contract) => contract.status === ContractStatus.TERMINATED
    ).length;
    const pendingCount = contracts.filter(
      (contract) => contract.status === ContractStatus.PENDING
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: contracts,
        statistics: {
          totalContracts,
          totalValue,
          activeCount,
          expiredCount,
          terminatedCount,
          pendingCount,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching contracts:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// CREATE new contract
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await req.json();

    const {
      title,
      counterparty,
      startDate,
      endDate,
      status,
      value,
      description,
    } = body;

    // Required field validation
    if (
      !title ||
      !counterparty ||
      !startDate ||
      !endDate ||
      value === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title, counterparty, start date, end date, and value are required",
        },
        { status: 400 }
      );
    }

    // Validate value
    if (value < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Value cannot be negative",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Removed: if (end < start) validation

    // Validate status if provided
    if (status && !Object.values(ContractStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Create new contract
    const contract = await Contract.create({
      title,
      counterparty,
      startDate: start,
      endDate: end,
      status: status || ContractStatus.PENDING,
      value,
      description,
    });

    // Return without internal fields
    const contractResponse = contract.toObject();
    delete contractResponse.__v;

    return NextResponse.json(
      {
        success: true,
        message: "Contract created successfully",
        data: contractResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating contract:", err);

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

// UPDATE contract - api/contracts/route.ts
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
          error: "Contract ID is required",
        },
        { status: 400 }
      );
    }

    // Check if contract exists
    const existingContract = await Contract.findById(id);
    if (!existingContract) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract not found",
        },
        { status: 404 }
      );
    }

    // Validate value if provided
    if (updateData.value !== undefined && updateData.value < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Value cannot be negative",
        },
        { status: 400 }
      );
    }

    // Removed: Date validation logic

    // Validate status if provided
    if (
      updateData.status &&
      !Object.values(ContractStatus).includes(updateData.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // Update contract with proper date handling
    const updatedContract = await Contract.findByIdAndUpdate(
      id,
      {
        ...updateData,
        // Ensure dates are properly formatted
        ...(updateData.startDate && {
          startDate: new Date(updateData.startDate),
        }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    return NextResponse.json(
      {
        success: true,
        message: "Contract updated successfully",
        data: updatedContract,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating contract:", err);

    // Handle mongoose validation errors
    if (err instanceof Error && err.name === "ValidationError") {
      const validationError = err as any;
      const errors = Object.values(validationError.errors).map(
        (error: any) => error.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation error: " + errors.join(", "),
        },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid contract ID format",
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

// DELETE contract
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
          error: "Contract ID is required",
        },
        { status: 400 }
      );
    }

    // Check if contract exists
    const existingContract = await Contract.findById(id);
    if (!existingContract) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract not found",
        },
        { status: 404 }
      );
    }

    // Delete contract
    await Contract.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Contract deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting contract:", err);

    // Handle cast errors (invalid ObjectId)
    if (err instanceof Error && err.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid contract ID format",
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