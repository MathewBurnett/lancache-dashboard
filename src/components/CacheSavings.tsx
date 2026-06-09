"use client";

import { ShieldCheck, CloudDownload, HardDriveDownload } from "lucide-react";
import { formatBytes } from "@/lib/format";

interface Props {
  servedFromCache: number;
  servedFromUpstream: number;
}

export function CacheSavings({ servedFromCache, servedFromUpstream }: Props) {
  const totalCacheable = servedFromCache + servedFromUpstream;
  const cachePct = totalCacheable > 0 ? (servedFromCache / totalCacheable) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-green-950/30 p-6">
      {/* Glow accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Hero metric */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Bandwidth saved by cache</p>
            <p className="text-3xl font-bold text-white tracking-tight mt-0.5">{formatBytes(servedFromCache)}</p>
            <p className="text-xs text-green-400 mt-0.5 font-medium">{cachePct.toFixed(1)}% of cacheable traffic served locally</p>
          </div>
        </div>

        {/* Split visualization */}
        <div className="flex-1 lg:max-w-md lg:ml-auto w-full">
          {/* Bar */}
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-800 mb-3">
            <div className="bg-green-500 transition-all" style={{ width: `${Math.max(cachePct, 1)}%` }} />
            <div className="bg-amber-500/70 transition-all" style={{ width: `${Math.max(100 - cachePct, 1)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-950/40 border border-gray-800 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <HardDriveDownload className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">From Cache</span>
              </div>
              <p className="text-lg font-bold text-green-400">{formatBytes(servedFromCache)}</p>
            </div>
            <div className="rounded-xl bg-gray-950/40 border border-gray-800 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CloudDownload className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">From Internet</span>
              </div>
              <p className="text-lg font-bold text-amber-400">{formatBytes(servedFromUpstream)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
