import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}