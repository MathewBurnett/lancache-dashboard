import { parseLogFile } from "./parser";
import { tryAcquireIngest, releaseIngest } from "./progress";
import path from "path";

const LOG_PATH = process.env.LOG_PATH || path.join(process.cwd(), "..", "logs", "access.log");
const INTERVAL_MS = 60_000; // Parse new entries every 60 seconds

let intervalId: ReturnType<typeof setInterval> | null = null;

async function ingestOnce() {
  // Shared lock prevents collision with a manual ingest
  if (!tryAcquireIngest()) return;
  try {
    // Process up to 500K lines per cycle to avoid blocking for too long
    const lines = await parseLogFile(LOG_PATH, undefined, 500_000);
    if (lines > 0) {
      console.log(`[auto-ingest] Parsed ${lines.toLocaleString()} new log entries`);
    }
  } catch (err) {
    console.error("[auto-ingest] Error:", err);
  } finally {
    releaseIngest();
  }
}

export function startAutoIngest() {
  if (intervalId) return; // Already running

  console.log(`[auto-ingest] Starting automatic log ingestion every ${INTERVAL_MS / 1000}s`);
  console.log(`[auto-ingest] Log path: ${LOG_PATH}`);

  // Run immediately on start
  ingestOnce();

  // Then run on interval
  intervalId = setInterval(ingestOnce, INTERVAL_MS);
}

export function stopAutoIngest() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[auto-ingest] Stopped");
  }
}
