// Central registry of known LanCache services.
// Service tags come from the `[service]` prefix lancache writes per log line,
// derived from https://github.com/uklans/cache-domains. Any service not listed
// here is still tracked and displayed — it just uses a fallback label/color.

export interface ServiceMeta {
  label: string;
  color: string; // hex, used for charts/dots
  abbr: string; // short tag for tiny thumbnails
}

const SERVICES: Record<string, ServiceMeta> = {
  steam: { label: "Steam", color: "#66c0f4", abbr: "STM" },
  epicgames: { label: "Epic Games", color: "#9ca3af", abbr: "EPC" },
  blizzard: { label: "Battle.net", color: "#148EFF", abbr: "BNT" },
  riot: { label: "Riot Games", color: "#d13639", abbr: "RGT" },
  origin: { label: "EA / Origin", color: "#f56c2d", abbr: "EA" },
  uplay: { label: "Ubisoft", color: "#2563eb", abbr: "UBI" },
  wsus: { label: "Windows Update", color: "#0078d4", abbr: "WIN" },
  nintendo: { label: "Nintendo", color: "#e60012", abbr: "NTD" },
  sony: { label: "PlayStation", color: "#003087", abbr: "PSN" },
  xboxlive: { label: "Xbox Live", color: "#107c10", abbr: "XBX" },
  cod: { label: "Call of Duty", color: "#4b5563", abbr: "COD" },
  rockstar: { label: "Rockstar", color: "#fcaf17", abbr: "RST" },
  arenanet: { label: "ArenaNet", color: "#c0392b", abbr: "ANE" },
  bsg: { label: "Escape from Tarkov", color: "#9a8866", abbr: "EFT" },
  cityofheroes: { label: "City of Heroes", color: "#2980b9", abbr: "COH" },
  daybreak: { label: "Daybreak", color: "#e67e22", abbr: "DBG" },
  frontier: { label: "Frontier", color: "#16a085", abbr: "FRO" },
  neverwinter: { label: "Neverwinter", color: "#8e44ad", abbr: "NWN" },
  nexusmods: { label: "Nexus Mods", color: "#da8e35", abbr: "NXM" },
  pathofexile: { label: "Path of Exile", color: "#7f1d1d", abbr: "POE" },
  renegadex: { label: "Renegade X", color: "#6b7280", abbr: "RNX" },
  square: { label: "Final Fantasy XIV", color: "#a855f7", abbr: "FF14" },
  teso: { label: "Elder Scrolls Online", color: "#2c7a3f", abbr: "ESO" },
  warframe: { label: "Warframe", color: "#00b3e6", abbr: "WF" },
  wargaming: { label: "Wargaming", color: "#c0392b", abbr: "WG" },
  test: { label: "Test", color: "#6b7280", abbr: "TST" },
};

// Stable fallback palette for services not in the registry.
const FALLBACK_PALETTE = [
  "#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ec4899",
  "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#ef4444",
];

function fallbackColor(service: string): string {
  let hash = 0;
  for (let i = 0; i < service.length; i++) {
    hash = (hash * 31 + service.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export function getServiceMeta(service: string): ServiceMeta {
  const key = service.toLowerCase();
  if (SERVICES[key]) return SERVICES[key];
  return {
    label: service.charAt(0).toUpperCase() + service.slice(1),
    color: fallbackColor(key),
    abbr: service.slice(0, 3).toUpperCase(),
  };
}

export function getServiceLabel(service: string): string {
  return getServiceMeta(service).label;
}

export function getServiceColor(service: string): string {
  return getServiceMeta(service).color;
}

export function getServiceAbbr(service: string): string {
  return getServiceMeta(service).abbr;
}
