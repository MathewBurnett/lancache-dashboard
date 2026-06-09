"use client";

interface ServiceIconProps {
  service: string;
  size?: number;
  className?: string;
}

const SERVICE_COLORS: Record<string, { bg: string; text: string; letter: string }> = {
  steam: { bg: "bg-[#1b2838]", text: "text-[#66c0f4]", letter: "S" },
  epicgames: { bg: "bg-[#2a2a2a]", text: "text-white", letter: "E" },
  riot: { bg: "bg-[#d13639]", text: "text-white", letter: "R" },
  battlenet: { bg: "bg-[#148EFF]", text: "text-white", letter: "B" },
  wsus: { bg: "bg-[#0078d4]", text: "text-white", letter: "W" },
  uplay: { bg: "bg-black", text: "text-white", letter: "U" },
  playstation: { bg: "bg-[#003087]", text: "text-white", letter: "P" },
  xbox: { bg: "bg-[#107c10]", text: "text-white", letter: "X" },
  nintendo: { bg: "bg-[#e60012]", text: "text-white", letter: "N" },
  origin: { bg: "bg-[#f56c2d]", text: "text-white", letter: "EA" },
};

export function ServiceIcon({ service, size = 24, className = "" }: ServiceIconProps) {
  const key = service.toLowerCase();
  const config = SERVICE_COLORS[key];

  const bg = config?.bg || "bg-gray-700";
  const textColor = config?.text || "text-gray-300";
  const letter = config?.letter || service.charAt(0).toUpperCase();

  return (
    <div
      className={`inline-flex items-center justify-center rounded shrink-0 ${bg} ${textColor} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      <span className="font-bold leading-none">{letter}</span>
    </div>
  );
}
