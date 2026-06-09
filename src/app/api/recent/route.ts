import { NextRequest, NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const includeAll = req.nextUrl.searchParams.get("includeAll") === "1";
    const recent = getRecentActivity(100, { includeAll });
    return NextResponse.json({ recent });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 });
  }
}
