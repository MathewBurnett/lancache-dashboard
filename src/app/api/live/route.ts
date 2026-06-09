import { NextRequest } from "next/server";
import { getActiveDownloads } from "@/lib/live-tracker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const includeAll = req.nextUrl.searchParams.get("includeAll") === "1";

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = () => {
        if (closed) return;
        try {
          const snapshot = getActiveDownloads(includeAll);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
        } catch {
          // ignore transient errors
        }
      };

      // Immediate snapshot on connect, then every second
      send();
      const intervalId = setInterval(send, 1000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
