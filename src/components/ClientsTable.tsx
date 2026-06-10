"use client";

import { Users } from "lucide-react";
import { formatBytes, formatNumber, getServiceLabel, getServiceColor } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

interface Client {
  clientIp: string;
  requests: number;
  bytesSent: number;
  cacheHits: number;
  cacheMisses: number;
  hitBytes: number;
  missBytes: number;
  topService: string;
}

function rankStyle(i: number) {
  if (i === 0) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (i === 1) return "bg-gray-400/20 text-gray-300 border-gray-400/30";
  if (i === 2) return "bg-orange-700/20 text-orange-400 border-orange-700/30";
  return "bg-gray-800 text-gray-500 border-gray-700/50";
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const maxBytes = clients[0]?.bytesSent || 1;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <SectionHeader icon={Users} title="Top Clients" subtitle={`${clients.length} clients by bandwidth`} accent="purple" />

      {clients.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-10">No client data yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {clients.map((client, i) => {
            const cacheable = client.hitBytes + client.missBytes;
            const hitRate = cacheable > 0 ? Math.round((client.hitBytes / cacheable) * 100) : 0;
            const dotColor = getServiceColor(client.topService);
            const barPct = (client.bytesSent / maxBytes) * 100;
            const hitColor = hitRate >= 50 ? "text-green-400" : hitRate > 0 ? "text-amber-400" : "text-gray-500";
            const hitBar = hitRate >= 50 ? "bg-green-500" : hitRate > 0 ? "bg-amber-500" : "bg-gray-600";

            return (
              <div key={client.clientIp} className="relative rounded-xl bg-gray-800/40 border border-gray-800 hover:border-gray-700 p-3 overflow-hidden transition-colors">
                {/* Bandwidth bar background */}
                <div className="absolute inset-y-0 left-0 bg-purple-500/5" style={{ width: `${barPct}%` }} />

                <div className="relative flex items-center gap-3">
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${rankStyle(i)}`}>
                    {i + 1}
                  </div>

                  {/* IP + service */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-100 font-mono">{client.clientIp}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      <span className="text-[11px] text-gray-500">{getServiceLabel(client.topService)}</span>
                      <span className="text-[11px] text-gray-600">· {formatNumber(client.requests)} req</span>
                    </div>
                  </div>

                  {/* Cache saved */}
                  <div className="shrink-0 text-right hidden md:block">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Saved</div>
                    <div className="text-xs font-semibold text-green-400">{formatBytes(client.hitBytes)}</div>
                  </div>

                  {/* Hit rate */}
                  <div className="shrink-0 w-16 hidden sm:block">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-8 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                        <div className={`h-full rounded-full ${hitBar}`} style={{ width: `${Math.max(hitRate, 2)}%` }} />
                      </div>
                      <span className={`text-[11px] font-semibold ${hitColor}`}>{hitRate}%</span>
                    </div>
                  </div>

                  {/* Bandwidth */}
                  <div className="shrink-0 text-right w-20">
                    <div className="text-sm font-bold text-blue-400">{formatBytes(client.bytesSent)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
