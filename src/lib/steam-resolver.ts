import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(process.cwd(), "..", "data");

// Pre-built depot->app mapping published by the lancache-manager author (SteamKit PICS).
// ~100MB JSON, ~245k accurate mappings with names + cover images. No auth required.
const PICS_RELEASE_API = "https://api.github.com/repos/regix1/lancache-pics/releases/latest";
const PICS_FALLBACK_URL = "https://github.com/regix1/lancache-pics/releases/latest/download/pics_depot_mappings.json";
const PICS_PATH = path.join(DATA_DIR, "pics_depot_mappings.json");
const PICS_META_PATH = path.join(DATA_DIR, "pics_meta.json");
const DEPOT_CACHE_PATH = path.join(DATA_DIR, "steam-depots.json");

// Re-check for a new release at most this often (auto path)
const PICS_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24; // 24h

interface PicsMeta {
  tag: string;
  changeNumber: number;
  downloadedAt: number;
}

export interface DepotInfo {
  appId: string;
  appName: string;
  headerImage?: string;
  failed?: boolean;
  lastTried?: number;
}

interface PicsEntry {
  ownerId?: number;
  appIds?: number[];
  appNames?: string[];
  appHeaderImages?: string[];
}

function readMeta(): PicsMeta | null {
  try {
    return JSON.parse(fs.readFileSync(PICS_META_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeMeta(meta: PicsMeta) {
  try {
    ensureDataDir();
    fs.writeFileSync(PICS_META_PATH, JSON.stringify(meta));
  } catch { /* ignore */ }
}

/**
 * Ask GitHub for the latest release tag + asset URL. Cheap (~1 small JSON).
 * Returns null if the API is unreachable.
 */
async function getLatestRelease(): Promise<{ tag: string; url: string } | null> {
  try {
    const res = await fetch(PICS_RELEASE_API, {
      headers: { "User-Agent": "lancache-dashboard", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tag: string = data.tag_name;
    const asset = (data.assets || []).find((a: { name: string }) => a.name === "pics_depot_mappings.json");
    return { tag, url: asset?.browser_download_url || PICS_FALLBACK_URL };
  } catch {
    return null;
  }
}

// ---- In-memory PICS map: depotId -> {name, image} ----
let picsMap: Map<string, { appName: string; headerImage: string }> | null = null;
let picsLoading = false;
let picsChangeNumber = 0;

// ---- Fallback per-depot cache (store API guesses) ----
let depotCache: Record<string, DepotInfo> = {};
let depotCacheLoaded = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Download the PICS mapping file (streamed to disk). Returns true on success.
 * Reports byte progress + instantaneous speed via the optional callback.
 */
async function downloadPics(
  url: string,
  onProgress?: (downloaded: number, total: number, speedBps: number) => void
): Promise<boolean> {
  ensureDataDir();
  const tmp = PICS_PATH + ".tmp";
  try {
    console.log("[steam-resolver] Downloading PICS depot mappings (~100MB)...");
    const res = await fetch(url, { signal: AbortSignal.timeout(1000 * 60 * 10) });
    if (!res.ok || !res.body) {
      console.error("[steam-resolver] PICS download failed:", res.status);
      return false;
    }
    const total = Number(res.headers.get("content-length")) || 0;
    let downloaded = 0;
    const startedAt = Date.now();

    const out = fs.createWriteStream(tmp);
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // Honour backpressure so a slow disk never balloons memory
      if (!out.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => out.once("drain", resolve));
      }
      downloaded += value.length;
      const elapsed = (Date.now() - startedAt) / 1000;
      const speed = elapsed > 0 ? downloaded / elapsed : 0;
      if (onProgress) onProgress(downloaded, total, speed);
    }
    await new Promise<void>((resolve, reject) => {
      out.end((err: unknown) => (err ? reject(err) : resolve()));
    });
    fs.renameSync(tmp, PICS_PATH);
    const secs = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(`[steam-resolver] PICS download complete in ${secs}s`);
    return true;
  } catch (err) {
    console.error("[steam-resolver] PICS download error:", err);
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { /* ignore */ }
    return false;
  }
}

/**
 * Parse the PICS file into the in-memory depot map.
 */
function parsePicsFile() {
  try {
    const raw = fs.readFileSync(PICS_PATH, "utf-8");
    const data = JSON.parse(raw);
    const mappings: Record<string, PicsEntry> = data.depotMappings || {};
    const map = new Map<string, { appName: string; headerImage: string }>();

    for (const [depotId, entry] of Object.entries(mappings)) {
      if (depotId === "0") continue; // shared/unknown bucket
      const name = entry.appNames?.[0];
      if (!name) continue;
      const image = entry.appHeaderImages?.[0]
        || `https://cdn.akamai.steamstatic.com/steam/apps/${entry.ownerId}/header.jpg`;
      map.set(depotId, { appName: name, headerImage: image });
    }

    picsMap = map;
    picsChangeNumber = data.metadata?.lastChangeNumber || 0;
    console.log(`[steam-resolver] Loaded ${map.size} PICS depot mappings (change #${picsChangeNumber})`);
  } catch (err) {
    console.error("[steam-resolver] Failed to parse PICS file:", err);
    picsMap = new Map();
  }
}

/**
 * Ensure the PICS map is available. Downloads only when:
 *  - the file is missing, or
 *  - we haven't checked GitHub in 24h AND a newer release tag exists.
 * Otherwise it just parses the existing file. Avoids re-downloading 100MB daily.
 */
async function ensurePics(): Promise<void> {
  if (picsMap) return;
  if (picsLoading) return;
  picsLoading = true;
  try {
    const meta = readMeta();
    const hasFile = fs.existsSync(PICS_PATH);

    let needsDownload = !hasFile;
    let url = PICS_FALLBACK_URL;

    // Only hit the GitHub API if we haven't checked recently (or have no file)
    const checkedRecently = meta && Date.now() - meta.downloadedAt < PICS_CHECK_INTERVAL_MS;
    if (!hasFile || !checkedRecently) {
      const latest = await getLatestRelease();
      if (latest) {
        url = latest.url;
        if (!hasFile || latest.tag !== meta?.tag) needsDownload = true;
      }
    }

    if (needsDownload) {
      const ok = await downloadPics(url);
      if (ok) {
        parsePicsFile();
        const latest = await getLatestRelease();
        writeMeta({ tag: latest?.tag || "", changeNumber: picsChangeNumber, downloadedAt: Date.now() });
        return;
      }
      if (!hasFile) return; // nothing to parse yet
    }

    // Parse existing file
    parsePicsFile();
  } finally {
    picsLoading = false;
  }
}

// ---- Fallback: store API per-depot guess (for depots not in PICS) ----
function loadDepotCache() {
  if (depotCacheLoaded) return;
  try {
    if (fs.existsSync(DEPOT_CACHE_PATH)) depotCache = JSON.parse(fs.readFileSync(DEPOT_CACHE_PATH, "utf-8"));
  } catch {
    depotCache = {};
  }
  depotCacheLoaded = true;
}

function saveDepotCache() {
  try {
    ensureDataDir();
    fs.writeFileSync(DEPOT_CACHE_PATH, JSON.stringify(depotCache));
  } catch { /* ignore */ }
}

async function tryAppDetails(appId: string): Promise<DepotInfo | null> {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`, {
      signal: AbortSignal.timeout(8000),
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.[appId];
    if (entry?.success && entry?.data?.name) {
      return {
        appId,
        appName: entry.data.name,
        headerImage: entry.data.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      };
    }
  } catch { /* ignore */ }
  return null;
}

async function resolveViaStoreApi(depotId: string): Promise<DepotInfo> {
  const depotNum = parseInt(depotId);
  for (const offset of [1, 0, 2, 3, 4, 5]) {
    const candidate = depotNum - offset;
    if (candidate <= 0) continue;
    const result = await tryAppDetails(String(candidate));
    if (result) return result;
    await new Promise((r) => setTimeout(r, 150));
  }
  return { appId: depotId, appName: `Depot ${depotId}`, failed: true, lastTried: Date.now() };
}

const RETRY_INTERVAL_MS = 1000 * 60 * 30;

/**
 * Resolve a batch of depot IDs. PICS map is authoritative; store API is a
 * fallback for depots not present in PICS (very new or private content).
 */
export async function resolveDepotBatch(depotIds: string[], storeFallbackLimit = 8): Promise<void> {
  await ensurePics();
  loadDepotCache();

  const now = Date.now();
  const storeNeeded: string[] = [];

  for (const depotId of depotIds) {
    // 1. PICS authoritative
    if (picsMap?.has(depotId)) {
      const hit = picsMap.get(depotId)!;
      depotCache[depotId] = { appId: depotId, appName: hit.appName, headerImage: hit.headerImage };
      continue;
    }
    // 2. Already resolved via fallback
    const cached = depotCache[depotId];
    if (cached && !cached.appName.startsWith("Depot ")) continue;
    // 3. Needs store fallback (respect retry interval for failed ones)
    if (cached?.failed && cached.lastTried && now - cached.lastTried < RETRY_INTERVAL_MS) continue;
    storeNeeded.push(depotId);
  }

  // Resolve a limited number via the store API to respect rate limits
  let changed = storeNeeded.length === 0 ? false : true;
  for (const depotId of storeNeeded.slice(0, storeFallbackLimit)) {
    depotCache[depotId] = await resolveViaStoreApi(depotId);
  }
  // Persist PICS-resolved entries too
  if (depotIds.some((d) => picsMap?.has(d))) changed = true;
  if (changed) saveDepotCache();
}

export function getResolvedDepots(): Record<string, DepotInfo> {
  loadDepotCache();
  return { ...depotCache };
}

export function getPicsStatus() {
  return {
    loaded: !!picsMap,
    mappings: picsMap?.size || 0,
    changeNumber: picsChangeNumber,
    hasFile: fs.existsSync(PICS_PATH),
  };
}

/**
 * Manual refresh. Checks the latest release tag first; if it matches what we
 * already have, it skips the 100MB download entirely. Reports progress.
 */
export async function refreshPics(
  onProgress?: (phase: "checking" | "downloading" | "parsing", downloaded: number, total: number, speedBps: number) => void
): Promise<{ mappings: number; changeNumber: number; unchanged: boolean } | null> {
  onProgress?.("checking", 0, 0, 0);
  const latest = await getLatestRelease();
  const meta = readMeta();
  const hasFile = fs.existsSync(PICS_PATH);

  // Up to date already — just make sure it's parsed in memory
  if (latest && meta && hasFile && latest.tag === meta.tag) {
    if (!picsMap) parsePicsFile();
    return { mappings: picsMap?.size || 0, changeNumber: picsChangeNumber, unchanged: true };
  }

  const url = latest?.url || PICS_FALLBACK_URL;
  const ok = await downloadPics(url, (d, t, s) => onProgress?.("downloading", d, t, s));
  if (!ok) return null;

  onProgress?.("parsing", 0, 0, 0);
  parsePicsFile();
  writeMeta({ tag: latest?.tag || "", changeNumber: picsChangeNumber, downloadedAt: Date.now() });
  return { mappings: picsMap?.size || 0, changeNumber: picsChangeNumber, unchanged: false };
}

/**
 * Re-resolve every provided depot against the (possibly refreshed) PICS map.
 * Returns a map of depotId -> resolved info for those now known.
 */
export function resolveFromPics(depotIds: string[]): Record<string, { appName: string; headerImage: string }> {
  const out: Record<string, { appName: string; headerImage: string }> = {};
  if (!picsMap) return out;
  for (const id of depotIds) {
    const hit = picsMap.get(id);
    if (hit) out[id] = hit;
  }
  return out;
}

export function extractDepotId(requestPath: string): string | null {
  const match = requestPath.match(/\/depot\/(\d+)\//);
  return match ? match[1] : null;
}
