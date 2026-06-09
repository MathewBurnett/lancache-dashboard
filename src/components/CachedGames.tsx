"use client";

import { useEffect, useState, useMemo } from "react";
import { Gamepad2, ChevronDown, Search, Database, Zap, FlaskConical, Info } from "lucide-react";
import { formatBytes, getServiceLabel } from "@/lib/format";

interface CachedGame {
  service: string;
  gameId: string;
  gameName: string;
  imageUrl: string;
  firstSeen: string;
  lastSeen: string;
  totalBytes: number;
  hitCount: number;
  missCount: number;
  servedFromCache: boolean;
  likelyCached: boolean;
}

interface Summary {
  totalGames: number;
  gamesInCache: number;
  totalCachedBytes: number;
}

const SERVICE_THEME: Record<string, { abbr: string; from: string; to: string; text: string }> = {
  steam: { abbr: "Steam", from: "from-[#1b2838]", to: "to-[#2a475e]", text: "text-[#66c0f4]" },
  epicgames: { abbr: "Epic", from: "from-[#202020]", to: "to-[#2f2f2f]", text: "text-white" },
  riot: { abbr: "Riot", from: "from-[#7a1f21]", to: "to-[#d13639]", text: "text-white" },
  battlenet: { abbr: "Battle.net", from: "from-[#0a4a8f]", to: "to-[#148EFF]", text: "text-white" },
  wsus: { abbr: "Windows", from: "from-[#005a9e]", to: "to-[#0078d4]", text: "text-white" },
  uplay: { abbr: "Ubisoft", from: "from-[#1a1a1a]", to: "to-[#3a3a3a]", text: "text-white" },
  playstation: { abbr: "PlayStation", from: "from-[#00216e]", to: "to-[#003087]", text: "text-white" },
  xbox: { abbr: "Xbox", from: "from-[#0b5e0b]", to: "to-[#107c10]", text: "text-white" },
  nintendo: { abbr: "Nintendo", from: "from-[#b3000e]", to: "to-[#e60012]", text: "text-white" },
  origin: { abbr: "EA", from: "from-[#c0541f]", to: "to-[#f56c2d]", text: "text-white" },
};

function theme(service: string) {
  return SERVICE_THEME[service.toLowerCase()] || { abbr: getServiceLabel(service), from: "from-gray-700", to: "to-gray-800", text: "text-gray-200" };
}

export function CachedGames() {
  const [allGames, setAllGames] = useState<CachedGame[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalGames: 0, gamesInCache: 0, totalCachedBytes: 0 });
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const res = await fetch("/api/games");
        const data = await res.json();
        if (cancelled) return;
        setAllGames(data.games || []);
        setSummary(data.summary || { totalGames: 0, gamesInCache: 0, totalCachedBytes: 0 });
        // If the server is still resolving depots in the background, poll again shortly
        if (data.resolving) {
          pollTimer = setTimeout(load, 4000);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  const services = useMemo(() => Array.from(new Set(allGames.map((g) => g.service))), [allGames]);

  const filteredGames = useMemo(() => {
    let games = allGames;
    if (serviceFilter !== "all") games = games.filter((g) => g.service === serviceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      games = games.filter((g) => g.gameName.toLowerCase().includes(q) || g.gameId.includes(q));
    }
    return games;
  }, [allGames, serviceFilter, search]);

  const visible = showAll || search ? filteredGames : filteredGames.slice(0, 8);
  const hasMore = !showAll && !search && filteredGames.length > 8;

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="h-6 w-44 bg-gray-800 rounded-lg animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-50 leading-none">Cached Games</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-semibold text-amber-400 uppercase tracking-wide">
                <FlaskConical className="w-2.5 h-2.5" /> Experimental
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{summary.totalGames} titles discovered</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <Database className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-green-400">{summary.gamesInCache}</span>
            <span className="text-[11px] text-green-500/70">likely cached</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">{formatBytes(summary.totalCachedBytes)}</span>
          </div>
        </div>
      </div>

      {/* Inferred-data note */}
      <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-800">
        <Info className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Inferred from access logs, not a live scan of the cache folder.
          <span className="text-gray-400"> Likely cached</span> means the title was active within the cache retention window, so it&apos;s probably still on disk.
          Eviction (LRU / max-age) happens silently and isn&apos;t reflected here.
        </p>
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-950/50 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-950/50 border border-gray-700/60 rounded-xl">
          <SegmentBtn active={serviceFilter === "all"} onClick={() => setServiceFilter("all")} label="All" count={allGames.length} />
          {services.map((svc) => (
            <SegmentBtn
              key={svc}
              active={serviceFilter === svc}
              onClick={() => setServiceFilter(svc)}
              label={getServiceLabel(svc)}
              count={allGames.filter((g) => g.service === svc).length}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {allGames.length === 0 ? "No cached games yet — run ingestion to discover content." : "No games match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((game) => (
            <GameCard key={`${game.service}-${game.gameId}`} game={game} />
          ))}
        </div>
      )}

      {/* Show more */}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-2 mx-auto mt-5 px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/70 border border-gray-700 rounded-xl hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all"
        >
          Show all {filteredGames.length} games
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function SegmentBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
        active ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30" : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-gray-700/60 text-gray-500"}`}>
        {count}
      </span>
    </button>
  );
}

function GameCard({ game }: { game: CachedGame }) {
  const [imgErr, setImgErr] = useState(false);
  const [imgSrc, setImgSrc] = useState(game.imageUrl);
  const t = theme(game.service);
  const resolved = !!game.gameName && !game.gameName.startsWith("Depot ");
  const name = resolved ? game.gameName : `Unknown content`;
  const total = game.hitCount + game.missCount;
  const hitRate = total > 0 ? Math.round((game.hitCount / total) * 100) : 0;
  const showImg = imgSrc && !imgErr;

  const hitColor = hitRate >= 50 ? "text-green-400" : hitRate > 0 ? "text-amber-400" : "text-gray-500";
  const barColor = hitRate >= 50 ? "bg-green-500" : hitRate > 0 ? "bg-amber-500" : "bg-gray-600";

  // When the PICS image 404s (common for unreleased titles), ask the store API
  // for the real (hashed) image URL and retry once before giving up.
  const handleImgError = async () => {
    if (game.service !== "steam") {
      setImgErr(true);
      return;
    }
    const appMatch = (imgSrc || "").match(/\/apps\/(\d+)\//);
    const appId = appMatch?.[1];
    if (!appId) {
      setImgErr(true);
      return;
    }
    try {
      const res = await fetch(`/api/games/image?appId=${appId}&depotId=${game.gameId}`);
      const data = await res.json();
      if (data.imageUrl && data.imageUrl !== imgSrc) {
        setImgSrc(data.imageUrl); // retry with the working URL
        return;
      }
    } catch {
      /* ignore */
    }
    setImgErr(true);
  };

  return (
    <div className="group rounded-xl overflow-hidden bg-gray-850 border border-gray-800 hover:border-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40">
      {/* Banner */}
      <div className="relative aspect-[460/215] overflow-hidden">
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${t.from} ${t.to} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${t.text} opacity-80`}>{t.abbr}</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wide text-gray-200 border border-white/10">
            {getServiceLabel(game.service)}
          </span>
          {game.likelyCached ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/90 backdrop-blur-sm text-[10px] font-semibold text-white" title="Active within the cache retention window — probably still on disk">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Likely cached
            </span>
          ) : game.servedFromCache ? (
            <span className="px-2 py-0.5 rounded-md bg-gray-700/80 backdrop-blur-sm text-[10px] font-semibold text-gray-300" title="Served from cache historically, but not recently — may have been evicted">
              Was cached
            </span>
          ) : null}
        </div>

        {/* Title overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className={`text-sm font-semibold leading-tight line-clamp-2 ${resolved ? "text-white" : "text-gray-400 italic"}`} title={name}>
            {name}
          </h4>
        </div>
      </div>

      {/* Stats footer */}
      <div className="p-3 space-y-2.5">
        {/* Top stat row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Bandwidth</p>
            <p className="text-sm font-bold text-blue-400">{formatBytes(game.totalBytes)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Requests</p>
            <p className="text-sm font-semibold text-gray-200">{total.toLocaleString()}</p>
          </div>
        </div>

        {/* Hit rate bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Cache Hit Rate</span>
            <span className={`text-[11px] font-bold ${hitColor}`}>{hitRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-700/70 overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.max(hitRate, 2)}%` }} />
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-gray-600">
          <span>{game.hitCount.toLocaleString()} hits · {game.missCount.toLocaleString()} miss</span>
          <span>{game.lastSeen.slice(0, 10)}</span>
        </div>
      </div>
    </div>
  );
}
