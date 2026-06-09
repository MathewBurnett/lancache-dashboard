import { NextResponse } from "next/server";
import { refreshPics, resolveFromPics, getPicsStatus } from "@/lib/steam-resolver";
import { getCachedGames, updateGameName } from "@/lib/queries";
import { depotProgress } from "@/lib/progress";
import { checkAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function runRefresh() {
  depotProgress.running = true;
  depotProgress.phase = "checking";
  depotProgress.downloadedBytes = 0;
  depotProgress.totalBytes = 0;
  depotProgress.speedBps = 0;
  depotProgress.mappings = 0;
  depotProgress.startedAt = Date.now();
  depotProgress.finishedAt = 0;
  depotProgress.message = "Checking for updates...";

  try {
    const result = await refreshPics((phase, downloaded, total, speedBps) => {
      depotProgress.phase = phase;
      depotProgress.downloadedBytes = downloaded;
      depotProgress.totalBytes = total;
      depotProgress.speedBps = speedBps;
      depotProgress.message =
        phase === "checking" ? "Checking for updates..."
        : phase === "downloading" ? "Downloading depot mappings..."
        : "Parsing mappings...";
    });

    if (!result) {
      depotProgress.phase = "error";
      depotProgress.message = "Download failed";
      return;
    }

    depotProgress.mappings = result.mappings;

    if (result.unchanged) {
      depotProgress.phase = "done";
      depotProgress.message = `Already up to date — ${result.mappings.toLocaleString()} mappings (change #${result.changeNumber})`;
      return;
    }

    // Apply freshly resolved names/images to existing cached games
    depotProgress.phase = "applying";
    depotProgress.message = "Applying mappings to cached games...";

    const games = getCachedGames(undefined, 1000);
    const steamDepots = games.filter((g) => g.service === "steam").map((g) => g.gameId);
    const resolved = resolveFromPics(steamDepots);
    let applied = 0;
    for (const depotId of Object.keys(resolved)) {
      const info = resolved[depotId];
      updateGameName("steam", depotId, info.appName, info.headerImage);
      applied++;
    }

    depotProgress.phase = "done";
    depotProgress.message = `Updated ${result.mappings.toLocaleString()} mappings · ${applied} games matched (change #${result.changeNumber})`;
  } catch (err) {
    depotProgress.phase = "error";
    depotProgress.message = `Error: ${String(err)}`;
    console.error("[depots/refresh] error:", err);
  } finally {
    depotProgress.running = false;
    depotProgress.finishedAt = Date.now();
  }
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (depotProgress.running) {
    return NextResponse.json({ message: "Depot refresh already in progress", running: true }, { status: 409 });
  }
  void runRefresh();
  return NextResponse.json({ started: true });
}

export function GET() {
  const pct =
    depotProgress.totalBytes > 0
      ? Math.min(100, Math.round((depotProgress.downloadedBytes / depotProgress.totalBytes) * 100))
      : depotProgress.running ? 0 : 100;

  return NextResponse.json({
    ...depotProgress,
    percent: pct,
    status: getPicsStatus(),
  });
}
