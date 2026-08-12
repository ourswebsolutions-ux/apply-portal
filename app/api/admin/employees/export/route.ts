import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        fullName: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Full Name", "Email"];

    const rows = employees.map((emp) =>
      [escapeCsv(emp.fullName), escapeCsv(emp.email)].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export employees:", error);
    return NextResponse.json(
      { error: "Failed to export employees" },
      { status: 500 }
    );
  }
}