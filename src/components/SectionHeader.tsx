"use client";

import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "purple" | "cyan" | "red";
  children?: React.ReactNode; // right-side content (chips, controls)
}

const ACCENTS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/15", text: "text-blue-400" },
  green: { bg: "bg-green-500/15", text: "text-green-400" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-400" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  red: { bg: "bg-red-500/15", text: "text-red-400" },
};

export function SectionHeader({ icon: Icon, title, subtitle, accent = "blue", children }: SectionHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${a.text}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-50 leading-none">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatChip({
  icon: Icon,
  value,
  label,
  accent = "blue",
}: {
  icon?: LucideIcon;
  value: string;
  label?: string;
  accent?: "blue" | "green" | "amber" | "purple" | "cyan" | "red" | "gray";
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    gray: "bg-gray-800 border-gray-700/50 text-gray-300",
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors[accent]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="text-xs font-semibold">{value}</span>
      {label && <span className="text-[11px] opacity-70">{label}</span>}
    </div>
  );
}
