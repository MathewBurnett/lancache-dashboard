export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i > 2 ? 2 : 0)} ${units[i]}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function getServiceColor(service: string): string {
  const colors: Record<string, string> = {
    steam: "#1b2838",
    epicgames: "#2a2a2a",
    battlenet: "#00AEFF",
    origin: "#f56c2d",
    riot: "#d13639",
    wsus: "#0078d4",
    uplay: "#0070ff",
    playstation: "#003087",
    xbox: "#107c10",
    nintendo: "#e60012",
    default: "#6b7280",
  };
  return colors[service.toLowerCase()] || colors.default;
}

export function getServiceLabel(service: string): string {
  const labels: Record<string, string> = {
    steam: "Steam",
    epicgames: "Epic Games",
    battlenet: "Battle.net",
    origin: "EA/Origin",
    riot: "Riot Games",
    wsus: "Windows Update",
    uplay: "Ubisoft",
    playstation: "PlayStation",
    xbox: "Xbox",
    nintendo: "Nintendo",
  };
  return labels[service.toLowerCase()] || service;
}
