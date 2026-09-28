import { create } from "zustand";
import {
  assignTrait,
  buyDowel,
  buyEarth,
  buyLathe,
  buyLumber,
  buyMega,
  buyMemory,
  buyProcessor,
  buyProject,
  carve,
  choose,
  entertain,
  fight,
  initialData,
  leavePlanet,
  normalize,
  nudgePrice,
  OFFLINE_CAP_SEC,
  playSkin,
  restart,
  sweep,
  syncSwarm,
  tick,
  tickMany,
  type EarthBuy,
  type GameData,
  type OfflineReport,
  type Trait,
} from "./sim";

const KEY = "tees.save.v5";
const BAK = "tees.save.v5.bak";
const OLD_KEYS = [
  "tees.save.v4",
  "tees.save.v4.bak",
  "tees.save.v3",
  "tees.save.v3.bak",
  "tees.save.v2",
  "tees.save.v2.bak",
  "tees.save.v1",
  "tees.save.bak",
];

export type GameStore = GameData & {
  hydrated: boolean;
  offline: OfflineReport | null;
  hydrate: () => void;
  persist: () => void;
  catchUp: () => void;
  tick: (dt: number) => void;
  carve: () => number;
  sweep: () => void;
  buyDowel: () => boolean;
  buyLumber: () => boolean;
  nudgePrice: (dir: -1 | 1) => void;
  buyLathe: () => boolean;
  buyMega: () => boolean;
  buyProcessor: () => boolean;
  buyMemory: () => boolean;
  buyProject: (id: string) => boolean;
  playSkin: () => void;
  buyEarth: (kind: EarthBuy) => boolean;
  syncSwarm: () => void;
  entertain: () => void;
  leavePlanet: () => void;
  assignTrait: (trait: Trait) => void;
  fight: () => void;
  choose: (accepted: boolean) => void;
  restart: () => void;
  reset: () => void;
  toggleSound: () => void;
  dismissOffline: () => void;
};

function toData(s: GameStore): GameData {
  const base = initialData();
  const keys = Object.keys(base) as (keyof GameData)[];
  const out = { ...base };
  for (const key of keys) {
    const value = s[key];
    if (value !== undefined) Object.assign(out, { [key]: value });
  }
  out.owned = [...s.owned];
  return out;
}

function writeSave(data: GameData): number {
  const savedAt = Date.now();
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BAK, prev);
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt }));
  } catch {
    /* private mode or quota */
  }
  return savedAt;
}

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readSave(): GameData | null {
  const current = normalize(readRaw(KEY)) ?? normalize(readRaw(BAK));
  if (current) return current;
  for (const key of OLD_KEYS) {
    const legacy = readRaw(key);
    if (!legacy || typeof legacy !== "object") continue;
    const fresh = initialData();
    const sound = (legacy as { sound?: unknown }).sound;
    if (typeof sound === "boolean") fresh.sound = sound;
    return fresh;
  }
  return null;
}

function applyGap(data: GameData): { data: GameData; offline: OfflineReport | null } {
  const gap = (Date.now() - data.savedAt) / 1000;
  if (gap < 20 || data.phase === "proposal" || data.phase === "epilogue") return { data, offline: null };
  const capped = Math.min(gap, OFFLINE_CAP_SEC);
  const tees = data.tees;
  const cash = data.cash;
  const next = tickMany(data, capped);
  next.savedAt = Date.now();
  const offline = { seconds: capped, tees: Math.max(0, next.tees - tees), cash: next.cash - cash };
  if (offline.tees < 1 && Math.abs(offline.cash) < 0.5 && next.phase === data.phase) return { data: next, offline: null };
  return { data: next, offline };
}

export const useGame = create<GameStore>((set, get) => ({
  ...initialData(),
  hydrated: false,
  offline: null,

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = readSave();
    if (!loaded) {
      set({ ...initialData(), hydrated: true, offline: null });
      return;
    }
    const { data, offline } = applyGap(loaded);
    set({ ...data, hydrated: true, offline });
  },

  persist: () => {
    const s = get();
    if (!s.hydrated) return;
    const savedAt = writeSave(toData(s));
    set({ savedAt });
  },

  catchUp: () => {
    const s = get();
    if (!s.hydrated || s.phase === "epilogue") return;
    const { data, offline } = applyGap(toData(s));
    if (!offline) return;
    set({ ...data, offline });
  },

  tick: (dt) => {
    const s = get();
    if (!s.hydrated || s.phase === "proposal" || s.phase === "epilogue") return;
    set(tick(toData(s), dt));
  },

  carve: () => {
    const result = carve(toData(get()));
    if (result.made <= 0) return 0;
    set(result.state);
    return result.made;
  },

  sweep: () => set(sweep(toData(get()))),

  buyDowel: () => {
    const before = get().wood;
    const next = buyDowel(toData(get()));
    if (next.wood === before) return false;
    set(next);
    return true;
  },

  buyLumber: () => {
    const before = get().wood;
    const next = buyLumber(toData(get()));
    if (next.wood === before) return false;
    set(next);
    return true;
  },

  nudgePrice: (dir) => set(nudgePrice(toData(get()), dir)),

  buyLathe: () => {
    const before = get().lathes;
    const next = buyLathe(toData(get()));
    if (next.lathes === before) return false;
    set(next);
    return true;
  },

  buyMega: () => {
    const before = get().megas;
    const next = buyMega(toData(get()));
    if (next.megas === before) return false;
    set(next);
    return true;
  },

  buyProcessor: () => {
    const before = get().processors;
    const next = buyProcessor(toData(get()));
    if (next.processors === before) return false;
    set(next);
    return true;
  },

  buyMemory: () => {
    const before = get().memory;
    const next = buyMemory(toData(get()));
    if (next.memory === before) return false;
    set(next);
    return true;
  },

  buyProject: (id) => {
    const before = get().owned.length;
    const next = buyProject(toData(get()), id);
    if (next.owned.length === before && next.phase === get().phase) return false;
    set(next);
    return true;
  },

  playSkin: () => {
    const next = playSkin(toData(get()));
    if (next.yomi === get().yomi) return;
    set(next);
  },

  buyEarth: (kind) => {
    const before = get().pile;
    const next = buyEarth(toData(get()), kind);
    if (next.pile === before) return false;
    set(next);
    return true;
  },

  syncSwarm: () => {
    const next = syncSwarm(toData(get()));
    if (next.boredom === get().boredom && next.syncAt === get().syncAt) return;
    set(next);
  },

  entertain: () => {
    const next = entertain(toData(get()));
    if (next.pile === get().pile) return;
    set(next);
  },

  leavePlanet: () => {
    const next = leavePlanet(toData(get()));
    if (next.phase === get().phase) return;
    set(next);
  },

  assignTrait: (trait) => {
    const next = assignTrait(toData(get()), trait);
    if (next.points === get().points) return;
    set(next);
  },

  fight: () => {
    const next = fight(toData(get()));
    if (next.flash === get().flash && next.yomi === get().yomi) return;
    set(next);
  },

  choose: (accepted) => {
    const next = choose(toData(get()), accepted);
    if (next.phase === get().phase) return;
    set(next);
  },

  restart: () => {
    const next = restart(toData(get()));
    if (next.phase === get().phase) return;
    writeSave(next);
    set({ ...next, offline: null });
  },

  reset: () => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(BAK);
      for (const key of OLD_KEYS) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    set({ ...initialData(), hydrated: true, offline: null });
  },

  toggleSound: () => set({ sound: !get().sound }),
  dismissOffline: () => set({ offline: null }),
}));
