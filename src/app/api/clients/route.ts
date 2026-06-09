import { NextRequest, NextResponse } from "next/server";
import { getClientStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const includeAll = req.nextUrl.searchParams.get("includeAll") === "1";
    const clients = getClientStats(50, { includeAll });
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
