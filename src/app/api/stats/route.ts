import { NextRequest, NextResponse } from "next/server";
import { getOverviewStats, getServiceStats, getDailyBandwidth, getHourlyBandwidthToday } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const includeAll = req.nextUrl.searchParams.get("includeAll") === "1";
    const opts = { includeAll };

    const overview = getOverviewStats(opts);
    const services = getServiceStats(20, opts);
    const dailyBandwidth = getDailyBandwidth(30, opts);
    const hourlyToday = getHourlyBandwidthToday();

    return NextResponse.json({
      overview,
      services,
      dailyBandwidth,
      hourlyToday,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
