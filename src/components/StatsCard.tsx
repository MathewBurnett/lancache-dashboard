"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "blue" | "green" | "amber" | "purple" | "cyan" | "red";
  trend?: { value: string; positive: boolean };
}

const ACCENTS: Record<string, { bg: string; text: string; glow: string }> = {
  blue: { bg: "bg-blue-500/15", text: "text-blue-400", glow: "group-hover:shadow-blue-500/10" },
  green: { bg: "bg-green-500/15", text: "text-green-400", glow: "group-hover:shadow-green-500/10" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-400", glow: "group-hover:shadow-amber-500/10" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400", glow: "group-hover:shadow-purple-500/10" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400", glow: "group-hover:shadow-cyan-500/10" },
  red: { bg: "bg-red-500/15", text: "text-red-400", glow: "group-hover:shadow-red-500/10" },
};

export function StatsCard({ title, value, subtitle, icon: Icon, accent = "blue", trend }: StatsCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className={`group bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:shadow-xl ${a.glow} transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${a.text}`} />
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${trend.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-600 mt-0.5">{subtitle}</div>}
    </div>
  );
}
