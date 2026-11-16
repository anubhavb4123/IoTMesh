// ═════════════════════════════════════════════════════════════════
// IoTMesh - ESP32 WLED Pixel LED Controller Service
// Target default address: http://192.168.29.40/
// ═════════════════════════════════════════════════════════════════

export const DEFAULT_WLED_IP = "http://192.168.29.40";
const STORAGE_KEY = "iotmesh_wled_endpoint";

export interface WledSegment {
  id: number;
  start: number;
  stop: number;
  len: number;
  on: boolean;
  bri: number;
  cct?: number;
  col: WledColor[];
  fx: number;
  sx: number; // speed 0-255
  ix: number; // intensity 0-255
  pal: number;
  sel?: boolean;
  rev?: boolean;
  mi?: boolean;
}

export interface WledState {
  on: boolean;
  bri: number; // 0-255
  transition?: number;
  ps: number; // active preset (-1 if none)
  pl: number; // active playlist
  nl?: {
    on: boolean;
    dur: number;
    mode: number;
    tbri: number;
    rem?: number;
  };
  udpn?: {
    send: boolean;
    recv: boolean;
  };
  lor?: number;
  mainseg?: number;
  seg: WledSegment[];
}

export interface WledInfo {
  ver: string;
  vid: number;
  leds: {
    count: number;
    pwr: number; // current draw in mA
    fps: number;
    maxpwr: number;
    maxseg: number;
  };
  name: string;
  udpport: number;
  live: boolean;
  lip: string;
  ws: number;
  fxcount: number;
  palcount: number;
  wifi?: {
    bssid?: string;
    rssi: number;
    signal: number;
    channel?: number;
  };
  fs?: {
    u: number;
    t: number;
    pmt: number;
  };
  ndc?: number;
  arch: string;
  core: string;
  freeheap: number;
  uptime: number;
  opt?: number;
  brand: string;
  product: string;
  mac: string;
  ip: string;
}

export interface WledFullData {
  state: WledState;
  info: WledInfo;
  effects: string[];
  palettes: string[];
}

export type WledColor = [number, number, number, number?];

export interface WledSegmentUpdate {
  id: number;
  on?: boolean;
  col?: WledColor[];
  fx?: number;
  sx?: number;
  ix?: number;
  pal?: number;
}

export interface WledUpdate {
  on?: boolean;
  bri?: number;
  seg?: WledSegmentUpdate[];
  ps?: number;
  nl?: { on: boolean; dur: number; mode: number; tbri: number };
}

// Curated color swatches
export const COLOR_SWATCHES = [
  { name: "Warm White", hex: "#FFA756", rgb: [255, 167, 86] as [number, number, number] },
  { name: "Neutral White", hex: "#FFF2DD", rgb: [255, 242, 221] as [number, number, number] },
  { name: "Cool Daylight", hex: "#EAF2FF", rgb: [234, 242, 255] as [number, number, number] },
  { name: "Crimson Red", hex: "#FF1744", rgb: [255, 23, 68] as [number, number, number] },
  { name: "Flame Orange", hex: "#FF6D00", rgb: [255, 109, 0] as [number, number, number] },
  { name: "Cyber Amber", hex: "#FFD600", rgb: [255, 214, 0] as [number, number, number] },
  { name: "Emerald Green", hex: "#00E676", rgb: [0, 230, 118] as [number, number, number] },
  { name: "Electric Cyan", hex: "#00E5FF", rgb: [0, 229, 255] as [number, number, number] },
  { name: "Deep Cobalt", hex: "#2979FF", rgb: [41, 121, 255] as [number, number, number] },
  { name: "Neon Purple", hex: "#D500F9", rgb: [213, 0, 249] as [number, number, number] },
  { name: "Hot Pink", hex: "#FF4081", rgb: [255, 64, 129] as [number, number, number] },
  { name: "Candlelight", hex: "#FF9329", rgb: [255, 147, 41] as [number, number, number] },
];

export function sanitizeWledUrl(input: string): string {
  const value = input.trim();
  try {
    const url = new URL(value.includes("://") ? value : `http://${value}`);
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username && !url.password && !url.search && !url.hash
    ) {
      return url.href.replace(/\/+$/, "");
    }
  } catch {
    // Invalid URL.
  }
  throw new Error("Enter a WLED IP address, hostname, or HTTP(S) URL.");
}

export function getWledEndpoint(): string {
  try {
    return sanitizeWledUrl(localStorage.getItem(STORAGE_KEY) || DEFAULT_WLED_IP);
  } catch {
    return DEFAULT_WLED_IP;
  }
}

export function setWledEndpoint(url: string): string {
  const clean = sanitizeWledUrl(url);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, clean);
  }
  return clean;
}

export function resetWledEndpoint(): string {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_WLED_IP;
}

// Convert Hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((ch) => ch + ch).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [255, 255, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Convert RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isWledState(value: unknown): value is WledState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<WledState>;
  return typeof state.on === "boolean" && typeof state.bri === "number" && Array.isArray(state.seg);
}

export function getMainSegment(state: WledState | undefined) {
  return state?.seg.find((segment) => segment.id === state.mainseg) ?? state?.seg[0];
}

export class WledClient {
  constructor(private readonly endpoint: string) {}

  private async request<T>(path: string, signal?: AbortSignal, update?: WledUpdate): Promise<T> {
    const useDevProxy = import.meta.env?.DEV && this.endpoint === DEFAULT_WLED_IP &&
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    const url = `${useDevProxy ? "/api/wled" : this.endpoint}${path}`;
    const timeout = AbortSignal.timeout(3500);
    try {
      const response = await fetch(url, {
        method: update ? "POST" : "GET",
        headers: update ? { "Content-Type": "application/json" } : undefined,
        body: update ? JSON.stringify({ ...update, v: true }) : undefined,
        credentials: "omit",
        cache: "no-store",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      if (!response.ok) throw new Error(`WLED returned HTTP ${response.status}.`);
      return await response.json() as T;
    } catch (error) {
      if (timeout.aborted) throw new Error(`Connection to ${this.endpoint} timed out.`);
      if (error instanceof TypeError && !signal?.aborted) {
        throw new Error(`Could not connect to WLED at ${this.endpoint}.`);
      }
      if (error instanceof SyntaxError) throw new Error("The address did not return WLED JSON.");
      throw error;
    }
  }

  async getFull(signal?: AbortSignal): Promise<WledFullData> {
    const data = await this.request<WledFullData>("/json", signal);
    if (!isWledState(data?.state) || typeof data.info?.ver !== "string") {
      throw new Error("The address did not return WLED device information.");
    }
    return {
      ...data,
      effects: Array.isArray(data.effects) ? data.effects : [],
      palettes: Array.isArray(data.palettes) ? data.palettes : [],
    };
  }

  async getPresets(signal?: AbortSignal): Promise<{ id: number; name: string }[]> {
    const data = await this.request<Record<string, { n?: string } | null>>("/presets.json", signal);
    return Object.entries(data).flatMap(([key, preset]) => {
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > 250 || !preset) return [];
      return [{ id, name: preset.n || `Preset ${id}` }];
    });
  }

  async updateState(update: WledUpdate): Promise<WledState> {
    const response = await this.request<Partial<WledState> & { state?: WledState; success?: boolean }>(
      "/json/state", undefined, update,
    );
    if (isWledState(response)) return response;
    if (isWledState(response?.state)) return response.state;

    // Some firmware returns only an acknowledgment even for a verbose request.
    if (response?.success === true) {
      const state = await this.request<unknown>("/json/state");
      if (isWledState(state)) return state;
    }
    throw new Error("WLED did not confirm its state.");
  }
}
