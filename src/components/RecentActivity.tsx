"use client";

import { History } from "lucide-react";
import { formatBytes, getServiceLabel, getServiceColor } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

interface RecentEntry {
  id: number;
  timestamp: string;
  service: string;
  clientIp: string;
  requestPath: string;
  bytesSent: number;
  cacheStatus: string;
  upstreamHost: string;
}

export function RecentActivity({ entries }: { entries: RecentEntry[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <SectionHeader icon={History} title="Recent Downloads" subtitle="Latest cache activity" accent="cyan" />

      {entries.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-3">
            <History className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">No recent activity</p>
          <p className="text-xs text-gray-600 mt-1">Run ingestion to populate.</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
          {entries.map((entry) => {
            const dotColor = getServiceColor(entry.service);
            const isHit = entry.cacheStatus === "HIT";
            const isMiss = entry.cacheStatus === "MISS";
            return (
              <div key={entry.id} className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-gray-800/50 transition-colors group">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 w-12 text-center ${
                  isHit ? "bg-green-500/15 text-green-400" : isMiss ? "bg-red-500/15 text-red-400" : "bg-gray-800 text-gray-500"
                }`}>
                  {entry.cacheStatus}
                </span>
                <span className="text-xs font-medium text-gray-300 w-24 shrink-0 truncate">{getServiceLabel(entry.service)}</span>
                <span className="text-[11px] text-gray-500 font-mono w-28 shrink-0">{entry.clientIp}</span>
                <span className="text-[11px] text-gray-600 truncate flex-1 group-hover:text-gray-500 transition-colors">{entry.requestPath}</span>
                <span className="text-xs font-semibold text-blue-400 shrink-0">{formatBytes(entry.bytesSent)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
