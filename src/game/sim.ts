import { owns, projectById, PROJECTS, type Cost, type ProjectDef } from "./projects.ts";

export const SAVE_VERSION = 5;
export const OFFLINE_CAP_SEC = 6 * 60 * 60;

export type Phase = "workshop" | "earth" | "space" | "proposal" | "epilogue";
export type Trait = "speed" | "explore" | "replication" | "hazard" | "factory" | "combat";
export type EarthBuy = "harvester" | "woodDrone" | "factory" | "solar" | "battery";

export const TRAITS: { id: Trait; label: string; detail: string }[] = [
  { id: "speed", label: "Speed", detail: "Cross the gap faster." },
  { id: "explore", label: "Exploration", detail: "Find matter worth cutting." },
  { id: "replication", label: "Replication", detail: "More caddies, from caddies." },
  { id: "hazard", label: "Hazard remediation", detail: "Fewer probes lost to the rough." },
  { id: "factory", label: "Factory production", detail: "Turn what you find into tees." },
  { id: "combat", label: "Combat", detail: "Hold the line against hackers." },
];

export const TEE_PRICES = [0.02, 0.04, 0.07, 0.1, 0.15, 0.25, 0.4];

export interface GameData {
  version: number;
  sound: boolean;
  phase: Phase;
  accepted: boolean;
  tees: number;
  unsold: number;
  cash: number;
  wood: number;
  woodQuote: number;
  priceIdx: number;
  lathes: number;
  megas: number;
  processors: number;
  memory: number;
  ops: number;
  creativity: number;
  trustSpent: number;
  yomi: number;
  honor: number;
  owned: string[];
  pile: number;
  matter: number;
  timber: number;
  harvesters: number;
  woodDrones: number;
  factories: number;
  solar: number;
  batteries: number;
  powerStored: number;
  boredom: number;
  syncAt: number;
  entertainAt: number;
  skinAt: number;
  flash: string;
  probes: number;
  hackers: number;
  universe: number;
  points: number;
  speed: number;
  explore: number;
  replication: number;
  hazard: number;
  factory: number;
  combat: number;
  seasons: number;
  clicks: number;
  clock: number;
  savedAt: number;
  /** Fractional tee already cut, not yet on the counter. */
  makeBuf: number;
  /** Fractional golfer already waiting, not yet a sale. */
  sellBuf: number;
}

export interface OfflineReport {
  seconds: number;
  tees: number;
  cash: number;
}

export interface Offer {
  def: ProjectDef;
  afford: boolean;
  cost: string;
}

export interface View {
  price: number;
  quote: number;
  demand: number;
  make: number;
  click: number;
  woodEach: number;
  dowelWood: number;
  dowelCost: number;
  lumberWood: number;
  lumberCost: number;
  showLumber: boolean;
  latheCost: number;
  megaCost: number;
  showMega: boolean;
  trust: number;
  trustLeft: number;
  opsMax: number;
  offers: Offer[];
  powerProd: number;
  powerDraw: number;
  powerCap: number;
  swarm: number;
  harvesterCost: number;
  woodDroneCost: number;
  factoryCost: number;
  solarCost: number;
  batteryCost: number;
  coach: string;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function initialData(): GameData {
  return {
    version: SAVE_VERSION,
    sound: true,
    phase: "workshop",
    accepted: false,
    tees: 0,
    unsold: 0,
    cash: 0,
    wood: 90,
    woodQuote: 3.4,
    priceIdx: 3,
    lathes: 0,
    megas: 0,
    processors: 0,
    memory: 0,
    ops: 0,
    creativity: 0,
    trustSpent: 0,
    yomi: 0,
    honor: 0,
    owned: [],
    pile: 0,
    matter: 0,
    timber: 0,
    harvesters: 0,
    woodDrones: 0,
    factories: 0,
    solar: 0,
    batteries: 0,
    powerStored: 0,
    boredom: 0,
    syncAt: 0,
    entertainAt: 0,
    skinAt: 0,
    flash: "",
    probes: 0,
    hackers: 0,
    universe: 0,
    points: 0,
    speed: 0,
    explore: 0,
    replication: 0,
    hazard: 0,
    factory: 0,
    combat: 0,
    seasons: 0,
    clicks: 0,
    clock: 0,
    savedAt: Date.now(),
    makeBuf: 0,
    sellBuf: 0,
  };
}

export function teePrice(s: GameData): number {
  return TEE_PRICES[clamp(s.priceIdx, 0, TEE_PRICES.length - 1)] * Math.pow(1.06, s.seasons);
}

export function quoteOf(s: GameData): number {
  let q = s.woodQuote;
  if (owns(s, "forestry")) q *= 0.72;
  if (owns(s, "bamboo")) q *= 0.85;
  return q;
}

export function woodEach(s: GameData): number {
  return owns(s, "precision") ? 0.5 : 1;
}

export function demandPerSec(s: GameData): number {
  const p = teePrice(s);
  let d = 1.7 * Math.pow(0.1 / Math.max(0.01, p), 1.15);
  if (owns(s, "slogan")) d *= 2;
  if (owns(s, "jingle")) d *= 2.2;
  if (owns(s, "placement")) d *= 2.3;
  if (owns(s, "laser")) d *= 1.45;
  return d;
}

export function makePerSec(s: GameData): number {
  return s.lathes * latheEach(s) + s.megas * megaEach(s);
}

export function latheEach(s: GameData): number {
  const season = Math.pow(1.1, s.seasons);
  let lathe = 0.55;
  if (owns(s, "improved")) lathe *= 1.9;
  if (owns(s, "taper")) lathe *= 1.22;
  if (owns(s, "height")) lathe *= 1.18;
  return lathe * season;
}

export function megaEach(s: GameData): number {
  const season = Math.pow(1.1, s.seasons);
  let mega = 6.5;
  if (owns(s, "height")) mega *= 1.2;
  return mega * season;
}

export function trustEarned(s: GameData): number {
  const steps = [40, 150, 600, 2500, 8000, 20000, 50000, 120000];
  let n = steps.filter((t) => s.tees >= t).length;
  if (owns(s, "slice")) n += 1;
  if (owns(s, "handicap")) n += 1;
  if (owns(s, "peace")) n += 2;
  if (owns(s, "azaleas")) n += 1;
  return n;
}

export function trustLeft(s: GameData): number {
  return Math.max(0, trustEarned(s) - s.trustSpent);
}

export function opsMax(s: GameData): number {
  return 100 + s.memory * 160;
}

export function dowelPack(): number {
  return 120;
}

export function lumberPack(): number {
  return 1600;
}

export function dowelCost(s: GameData): number {
  return quoteOf(s);
}

export function lumberCost(s: GameData): number {
  return quoteOf(s) * 11;
}

export function latheCost(s: GameData): number {
  return 12 * Math.pow(1.14, Math.min(s.lathes, 28));
}

export function megaCost(s: GameData): number {
  return 280 * Math.pow(1.16, Math.min(s.megas, 20));
}

function curve(base: number, n: number, growth: number): number {
  return Math.ceil(base * Math.pow(growth, Math.min(n, 40)));
}

export function harvesterCost(s: GameData): number {
  return curve(380, s.harvesters, 1.17);
}

export function woodDroneCost(s: GameData): number {
  return curve(400, s.woodDrones, 1.17);
}

export function factoryCost(s: GameData): number {
  return curve(900, s.factories, 1.18);
}

export function solarCost(s: GameData): number {
  return curve(480, Math.max(0, s.solar - 1), 1.14);
}

export function batteryCost(s: GameData): number {
  return curve(360, s.batteries, 1.13);
}

export function powerProd(s: GameData): number {
  return s.solar * 5;
}

export function powerDraw(s: GameData): number {
  return s.factories * 2.2 + (s.harvesters + s.woodDrones) * 0.35;
}

export function powerCap(s: GameData): number {
  return 40 + s.batteries * 90;
}

export const EARTH = {
  harvest: 8,
  mill: 10,
  stamp: 12,
  teesPerWood: 2,
  solar: 5,
  battery: 90,
};

export const SWARM = {
  syncDrop: 32,
  syncWait: 26,
  partyDrop: 45,
  partyCost: 900,
  partyWait: 20,
  slackAt: 35,
};

export function swarmFactor(s: GameData): number {
  if (s.boredom < SWARM.slackAt) return 1;
  return Math.max(0.28, 1 - (s.boredom - SWARM.slackAt) / 90);
}

function costLabel(cost: Cost): string {
  const parts: string[] = [];
  if (cost.cash) parts.push(formatMoney(cost.cash));
  if (cost.creativity) parts.push(`${formatCompact(cost.creativity)} creativity`);
  if (cost.ops) parts.push(`${formatCompact(cost.ops)} on the thinking bar`);
  if (cost.yomi) parts.push(`${cost.yomi} yomi`);
  return parts.join(" · ") || "Free";
}

export function canAfford(s: GameData, cost: Cost): boolean {
  if ((cost.cash ?? 0) > s.cash + 1e-6) return false;
  if ((cost.creativity ?? 0) > s.creativity + 1e-9) return false;
  if ((cost.ops ?? 0) > s.ops + 1e-6) return false;
  if ((cost.yomi ?? 0) > s.yomi) return false;
  return true;
}

function pay(s: GameData, cost: Cost): GameData {
  return {
    ...s,
    cash: s.cash - (cost.cash ?? 0),
    creativity: s.creativity - (cost.creativity ?? 0),
    ops: Math.max(0, s.ops - (cost.ops ?? 0)),
    yomi: s.yomi - (cost.yomi ?? 0),
  };
}

export function offersFor(s: GameData): Offer[] {
  if (s.phase !== "workshop") return [];
  return PROJECTS.filter((def) => !owns(s, def.id) && def.visible(s)).map((def) => ({
    def,
    afford: canAfford(s, def.cost),
    cost: costLabel(def.cost),
  }));
}

const FOCUS_IDS = [
  "drones",
  "monopoly",
  "slogan",
  "improved",
  "jingle",
  "precision",
  "taper",
  "forestry",
  "height",
  "placement",
  "mega",
  "laser",
  "skins",
];

export function priceNudge(s: GameData): -1 | 0 | 1 {
  if (s.phase !== "workshop") return 0;
  const unit = (quoteOf(s) / dowelPack()) * woodEach(s);
  const price = teePrice(s);
  if (s.priceIdx < TEE_PRICES.length - 1 && price < unit * 1.45) return 1;
  const dem = demandPerSec(s);
  const make = makePerSec(s);
  if (s.unsold > 28 && dem < Math.max(0.6, make * 0.8) && s.priceIdx > 0) {
    const next = TEE_PRICES[s.priceIdx - 1] * Math.pow(1.06, s.seasons);
    if (next >= unit * 1.45) return -1;
  }
  if (s.unsold < 6 && make > 0.15 && make < dem * 0.62 && s.priceIdx < TEE_PRICES.length - 1) return 1;
  return 0;
}

function cashGate(s: GameData): number {
  for (const id of ["slogan", "jingle", "placement", "monopoly"]) {
    if (owns(s, id)) continue;
    const def = projectById(id);
    if (!def?.visible(s)) continue;
    return def.cost.cash ?? 0;
  }
  return 0;
}

export function focusProject(s: GameData): string | null {
  if (s.phase !== "workshop") return null;
  const offers = offersFor(s);
  for (const id of FOCUS_IDS) {
    const offer = offers.find((o) => o.def.id === id);
    if (!offer) continue;
    const gated = id === "slogan" || id === "jingle" || id === "placement" || id === "monopoly" || id === "drones";
    if (gated && !offer.afford) return null;
    if (offer.afford) return id;
  }
  return null;
}

export function wantLathe(s: GameData): boolean {
  if (s.phase !== "workshop") return false;
  if (priceNudge(s) !== 0) return false;
  if (s.wood < woodEach(s) * 6) return false;
  if (s.unsold > 36) return false;
  const gate = cashGate(s);
  if (gate > 0 && s.cash < gate && makePerSec(s) > demandPerSec(s) * 0.55 && s.lathes >= 1) return false;
  if (makePerSec(s) >= demandPerSec(s) * 0.92) return false;
  return s.cash + 1e-6 >= latheCost(s);
}

export function wantMega(s: GameData): boolean {
  if (s.phase !== "workshop" || !owns(s, "mega")) return false;
  if (priceNudge(s) !== 0 || s.unsold > 36) return false;
  if (s.megas >= 3) return false;
  const gate = cashGate(s);
  if (gate > 0 && s.cash < gate) return false;
  if (makePerSec(s) >= demandPerSec(s) * 0.88) return false;
  return s.cash + 1e-6 >= megaCost(s);
}

export function earthFocus(s: GameData): EarthBuy | "sync" | "party" | null {
  if (s.phase !== "earth" || s.matter <= 0) return null;
  if (s.boredom >= SWARM.slackAt && powerProd(s) + 0.2 >= powerDraw(s) && s.solar >= 1 && s.factories >= 1) {
    if (s.clock >= s.syncAt) return "sync";
    if (s.clock >= s.entertainAt && s.pile >= SWARM.partyCost) return "party";
    return null;
  }
  let pick: EarthBuy = "harvester";
  if (s.solar < 1 || powerProd(s) + 0.2 < powerDraw(s)) pick = "solar";
  else if (s.factories < 1) pick = "factory";
  else if (s.timber > 40 && s.woodDrones * EARTH.mill + 0.1 < s.harvesters * EARTH.harvest) pick = "woodDrone";
  else if (s.wood > 40 && s.factories * EARTH.stamp + 0.1 < s.woodDrones * EARTH.mill) pick = "factory";
  else if (s.harvesters * EARTH.harvest + 1 < s.factories * EARTH.stamp) pick = "harvester";
  const cost =
    pick === "factory"
      ? factoryCost(s)
      : pick === "harvester"
        ? harvesterCost(s)
        : pick === "woodDrone"
          ? woodDroneCost(s)
          : solarCost(s);
  return s.pile + 1e-6 >= cost ? pick : null;
}

export function nextTrait(s: GameData): Trait | null {
  if (s.phase !== "space" || s.points < 1) return null;
  if (s.replication < 4) return "replication";
  if (s.factory < 3) return "factory";
  if (s.explore < 2) return "explore";
  if (s.hazard < 1) return "hazard";
  return "replication";
}

export function pricePreview(s: GameData, dir: -1 | 1): { price: number; demand: number } | null {
  const idx = s.priceIdx + dir;
  if (idx < 0 || idx >= TEE_PRICES.length) return null;
  const ghost = { ...s, priceIdx: idx };
  return { price: teePrice(ghost), demand: demandPerSec(ghost) };
}

function withOwned(s: GameData, id: string): GameData {
  return owns(s, id) ? s : { ...s, owned: [...s.owned, id] };
}

function spokenRate(n: number): string {
  return `${formatCompact(n)} a second`;
}

export function projectImpact(s: GameData, id: string): string {
  const nowD = demandPerSec(s);
  const nextD = demandPerSec(withOwned(s, id));
  const nowM = makePerSec(s);
  const nextM = makePerSec(withOwned(s, id));
  const demand =
    nextD > nowD + 0.05
      ? `More golfers show up: ${spokenRate(nowD)} becomes ${spokenRate(nextD)}.`
      : "";
  const cut =
    nextM > nowM + 0.05
      ? `Machines speed up: ${spokenRate(nowM)} becomes ${spokenRate(nextM)}.`
      : "";
  switch (id) {
    case "slogan":
    case "jingle":
    case "placement":
    case "laser":
      return demand || "More golfers ask for a tee.";
    case "improved":
    case "taper":
    case "height":
      return cut || "Every lathe cuts faster.";
    case "precision":
      return `Each tee uses ${formatTees(woodEach(s))} wood now, and 0.5 after. The same pile lasts longer.`;
    case "forestry":
    case "bamboo":
      return `A dowel costs ${formatMoney(quoteOf(s))} now, ${formatMoney(quoteOf(withOwned(s, id)))} after.`;
    case "broker":
      return "Buys lumber for you when wood runs low — only if those tees still sell for a profit.";
    case "skins":
      return "Unlocks a bet every 14 seconds. Win 3 yomi, or 1 if you halve the hole. Later projects spend yomi.";
    case "trading":
      return "Every sale pays about 12% extra cash. The bonus wobbles, so it is not a flat raise.";
    case "mega":
      return `Unlocks the mega-lathe. Each one cuts ${spokenRate(megaEach(withOwned(s, id)))} without you tapping.`;
    case "slice":
    case "handicap":
    case "azaleas":
      return "Trust +1. Spend it on a processor (that thinks up projects) or memory (a longer thinking bar).";
    case "peace":
      return "Trust +2. Spend each one on a processor or memory.";
    case "monopoly":
      return "You own every tee shop. This is the step before the caddie drones.";
    case "drones":
      return "The workshop ends. Drones turn the planet into tees, and you spend tees instead of cash.";
    default:
      return demand || cut || "A one-time upgrade.";
  }
}

export function spaceFlow(s: GameData): { grow: number; loss: number; drift: number; find: number } {
  return {
    grow: 0.0092 * (1 + s.replication * 0.12),
    loss: 0.0065 / (1 + s.hazard * 0.4),
    drift: 0.0035 / (1 + s.combat * 0.32),
    find: (0.55 + s.explore * 0.32 + s.speed * 0.1) * (0.4 + s.factory * 0.22),
  };
}

export function traitImpact(s: GameData, trait: Trait): string {
  const a = spaceFlow(s);
  const b = spaceFlow({ ...s, [trait]: s[trait] + 1 });
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const eat = `${formatRate(a.find)} → ${formatRate(b.find)} each.`;
  if (trait === "replication") return `Fleet copies ${pct(a.grow)} of itself each second → ${pct(b.grow)}.`;
  if (trait === "hazard") return `Lost each second ${pct(a.loss)} → ${pct(b.loss)}.`;
  if (trait === "combat") return `Quit to play golf ${pct(a.drift)} a second → ${pct(b.drift)}.`;
  return eat;
}

function coachOf(s: GameData): string {
  if (s.phase === "earth") {
    if (s.solar < 1) return "The drones are off. Buy a solar farm or nothing on this page moves.";
    if (s.factories < 1) return "Buy a tee factory first. It is what turns wood into tees you can spend.";
    if (powerProd(s) + 0.2 < powerDraw(s))
      return "The drones use more power than the sun makes. Buy a solar farm before the battery dies.";
    if (s.boredom >= SWARM.slackAt)
      return `Boredom is over ${SWARM.slackAt}, so every drone works slower. Sync them, or send them to the 19th hole.`;
    if (s.timber > 40 && s.woodDrones * EARTH.mill + 0.1 < s.harvesters * EARTH.harvest)
      return "Boards are stacking up. A wood drone mills them into wood the factories can stamp.";
    if (s.wood > 40 && s.factories * EARTH.stamp + 0.1 < s.woodDrones * EARTH.mill)
      return "Milled wood is sitting there. Another factory turns it into tees.";
    if (s.harvesters * EARTH.harvest + 1 < s.factories * EARTH.stamp)
      return "The factories want more forest than the harvesters are cutting. Buy a harvester.";
    return "Spend the tee pile on whichever step is behind. At zero forests, you can leave.";
  }
  if (s.phase === "space") {
    if (s.replication < 3)
      return "Put points into Replication first. It makes more caddies. The other buttons stay locked until you have 3.";
    if (s.points > 0)
      return "Factory next, then Exploration. Both make every caddie eat the universe faster.";
    if (s.hackers > s.probes * 0.15 && s.hackers > 8)
      return "Some caddies quit to play golf. Defend — it costs 1 yomi. A win gives a point back.";
    return "The fleet copies itself and eats matter. When the universe hits zero, someone makes you an offer.";
  }
  const nudge = priceNudge(s);
  const unit = (quoteOf(s) / dowelPack()) * woodEach(s);
  if (s.tees < 1) return "Tap Make tee. It sits on the counter until a golfer buys it. That is the only way to get cash.";
  if (nudge === 1 && teePrice(s) < unit * 1.45) return "You are charging less than the wood cost. Raise the price.";
  if (s.wood + 1e-9 < woodEach(s) && s.cash + 1e-6 < dowelCost(s))
    return "No wood and no cash. Sweep the floor — a free dowel is under the bench.";
  if (nudge === -1) return "Tees are piling up unsold. Lower the price so golfers take them.";
  if (nudge === 1) return "Golfers want tees faster than you make them. Raise the price: more cash, and the rush slows.";
  if (s.wood < woodEach(s) * 8) return "Wood is about to run out. Buy a dowel before the bench stops.";
  if (!owns(s, "slogan") && s.tees >= 40) return "Save $45 for the Tee Up slogan. It doubles how many golfers show up.";
  if (trustLeft(s) > 0 && s.processors < 1)
    return "You have trust to spend. A processor fills a thinking bar, and a full bar becomes creativity for projects.";
  if (wantLathe(s)) return "Buy an auto-lathe. It cuts tees while you mess with the price.";
  return "Keep tees on the counter, keep the price above the cost of wood, and buy the button marked Next.";
}

export function viewOf(s: GameData): View {
  return {
    price: teePrice(s),
    quote: quoteOf(s),
    demand: demandPerSec(s),
    make: makePerSec(s),
    click: 1 + Math.min(s.lathes, 20) * 0.02 + s.megas * 0.08,
    woodEach: woodEach(s),
    dowelWood: dowelPack(),
    dowelCost: dowelCost(s),
    lumberWood: lumberPack(),
    lumberCost: lumberCost(s),
    showLumber: s.tees >= 220 || owns(s, "broker"),
    latheCost: latheCost(s),
    megaCost: megaCost(s),
    showMega: owns(s, "mega"),
    trust: trustEarned(s),
    trustLeft: trustLeft(s),
    opsMax: opsMax(s),
    offers: offersFor(s),
    powerProd: powerProd(s),
    powerDraw: powerDraw(s),
    powerCap: powerCap(s),
    swarm: swarmFactor(s),
    harvesterCost: harvesterCost(s),
    woodDroneCost: woodDroneCost(s),
    factoryCost: factoryCost(s),
    solarCost: solarCost(s),
    batteryCost: batteryCost(s),
    coach: coachOf(s),
  };
}

function addMade(s: GameData, want: number): GameData {
  const per = woodEach(s);
  if (want <= 0 || s.wood <= 0 || per <= 0) return s;
  const made = Math.min(want, s.wood / per);
  if (!(made > 0)) return s;
  const buf = (s.makeBuf || 0) + made;
  const whole = Math.floor(buf);
  return {
    ...s,
    wood: s.wood - made * per,
    tees: s.tees + whole,
    unsold: s.unsold + whole,
    makeBuf: buf - whole,
  };
}

function sell(s: GameData, dt: number): GameData {
  const price = teePrice(s);
  let buf = (s.sellBuf || 0) + demandPerSec(s) * dt;
  const stock = Math.floor(s.unsold + 1e-6);
  const sold = Math.min(stock, Math.floor(buf));
  if (sold <= 0) {
    if (stock < 1) buf = Math.min(buf, 0.999);
    return { ...s, unsold: stock, sellBuf: buf };
  }
  buf -= sold;
  const left = stock - sold;
  if (left < 1) buf = Math.min(buf, 0.999);
  let cash = s.cash + sold * price;
  if (owns(s, "trading")) {
    const swing = (Math.random() - 0.46) * 0.25;
    cash += sold * price * 0.12 * (1 + swing);
  }
  return { ...s, unsold: left, sellBuf: buf, cash };
}

function think(s: GameData, dt: number): GameData {
  const cap = opsMax(s);
  if (s.processors <= 0) return { ...s, ops: Math.min(s.ops, cap) };
  if (s.ops >= cap - 1e-6) {
    return { ...s, ops: cap, creativity: s.creativity + s.processors * 0.11 * dt };
  }
  return { ...s, ops: Math.min(cap, s.ops + s.processors * dt) };
}

function broker(s: GameData): GameData {
  if (!owns(s, "broker") || s.phase !== "workshop") return s;
  const buffer = woodEach(s) * (makePerSec(s) + demandPerSec(s)) * 10;
  if (s.wood >= buffer) return s;
  const cost = lumberCost(s);
  const pack = lumberPack();
  if (s.cash < cost) return s;
  if (teePrice(s) * (pack / woodEach(s)) < cost * 1.2) return s;
  return { ...s, cash: s.cash - cost, wood: s.wood + pack };
}

function tickWorkshop(s: GameData, dt: number): GameData {
  let next = { ...s, clock: s.clock + dt };
  const anchor = 3.4;
  const wobble = (Math.random() - 0.5) * 0.05 * dt;
  const pull = (anchor - next.woodQuote) * 0.12 * dt;
  next.woodQuote = clamp(next.woodQuote * (1 + wobble) + pull, 2.3, 5.6);
  next = addMade(next, makePerSec(s) * dt);
  next = sell(next, dt);
  next = think(next, dt);
  next = broker(next);
  return next;
}

function tickEarth(s: GameData, dt: number): GameData {
  let next = { ...s, clock: s.clock + dt };
  const cap = powerCap(next);
  next.powerStored = Math.min(cap, next.powerStored + powerProd(next) * dt);
  const draw = powerDraw(next);
  const need = draw * dt;
  const used = Math.min(next.powerStored, need);
  next.powerStored -= used;
  const power = need <= 1e-9 ? 1 : used / need;
  const work = power * swarmFactor(next);
  const fell = Math.min(next.matter, next.harvesters * EARTH.harvest * work * dt);
  next.matter -= fell;
  next.timber += fell;
  const milled = Math.min(next.timber, next.woodDrones * EARTH.mill * work * dt);
  next.timber -= milled;
  next.wood += milled;
  const eaten = Math.min(next.wood, next.factories * EARTH.stamp * work * dt);
  next.wood -= eaten;
  const made = eaten * EARTH.teesPerWood;
  next.tees += made;
  next.pile += made;
  const drones = next.harvesters + next.woodDrones + next.factories;
  const rise = Math.max(0, drones - 3) * 0.09 * dt;
  next.boredom = clamp(next.boredom + rise - 0.008 * dt, 0, 100);
  if (next.matter <= 0 && next.timber <= 1) next.matter = 0;
  return next;
}

function tickSpace(s: GameData, dt: number): GameData {
  const next = { ...s, clock: s.clock + dt };
  if (next.probes <= 0 && next.universe > 0) return next;
  const flow = spaceFlow(next);
  const consume = Math.min(next.universe, next.probes * flow.find * dt);
  next.universe = Math.max(0, next.universe - consume);
  next.tees += consume;
  const born = next.probes * flow.grow * dt;
  const died = next.probes * flow.loss * dt;
  const turned = next.probes * flow.drift * dt;
  next.probes = Math.max(0, next.probes + born - died - turned);
  next.hackers += turned;
  if (next.universe <= 0) {
    next.universe = 0;
    next.phase = "proposal";
  }
  return next;
}

export function tick(input: GameData, dt: number): GameData {
  const step = clamp(dt, 0, 2);
  if (step <= 0) return input;
  if (input.phase === "proposal" || input.phase === "epilogue") return input;
  if (input.phase === "earth" && input.matter <= 0 && input.timber <= 1) return { ...input, matter: 0, timber: 0 };
  if (input.phase === "workshop") return scrub(tickWorkshop(input, step));
  if (input.phase === "earth") return scrub(tickEarth(input, step));
  return scrub(tickSpace(input, step));
}

export function tickMany(s: GameData, seconds: number): GameData {
  const total = clamp(seconds, 0, OFFLINE_CAP_SEC);
  const dt = 0.5;
  const steps = Math.floor(total / dt);
  let cur = s;
  for (let i = 0; i < steps; i++) {
    if (cur.phase === "proposal" || cur.phase === "epilogue") break;
    if (cur.phase === "earth" && cur.matter <= 0) break;
    cur = tick(cur, dt);
  }
  return cur;
}

export function carve(s: GameData): { state: GameData; made: number } {
  if (s.phase !== "workshop") return { state: s, made: 0 };
  const before = s.tees;
  const next = scrub(addMade({ ...s, clicks: s.clicks + 1 }, viewOf(s).click));
  return { state: next, made: Math.max(0, next.tees - before) };
}

export function sweep(s: GameData): GameData {
  if (s.phase !== "workshop") return s;
  if (s.wood + 1e-9 >= woodEach(s)) return s;
  if (s.cash + 1e-6 >= dowelCost(s)) return s;
  return { ...s, wood: s.wood + dowelPack(), flash: "A dropped dowel under the bench." };
}

export function buyDowel(s: GameData): GameData {
  if (s.phase !== "workshop") return s;
  const cost = dowelCost(s);
  if (s.cash + 1e-6 < cost) return s;
  return scrub({ ...s, cash: s.cash - cost, wood: s.wood + dowelPack() });
}

export function buyLumber(s: GameData): GameData {
  if (s.phase !== "workshop" || !viewOf(s).showLumber) return s;
  const cost = lumberCost(s);
  if (s.cash + 1e-6 < cost) return s;
  return scrub({ ...s, cash: s.cash - cost, wood: s.wood + lumberPack() });
}

export function nudgePrice(s: GameData, dir: -1 | 1): GameData {
  if (s.phase !== "workshop") return s;
  return { ...s, priceIdx: clamp(s.priceIdx + dir, 0, TEE_PRICES.length - 1) };
}

export function buyLathe(s: GameData): GameData {
  if (s.phase !== "workshop") return s;
  const cost = latheCost(s);
  if (s.cash + 1e-6 < cost) return s;
  return scrub({ ...s, cash: s.cash - cost, lathes: s.lathes + 1 });
}

export function buyMega(s: GameData): GameData {
  if (s.phase !== "workshop" || !owns(s, "mega")) return s;
  const cost = megaCost(s);
  if (s.cash + 1e-6 < cost) return s;
  return scrub({ ...s, cash: s.cash - cost, megas: s.megas + 1 });
}

export function buyProcessor(s: GameData): GameData {
  if (trustLeft(s) < 1 || s.phase !== "workshop") return s;
  return { ...s, processors: s.processors + 1, trustSpent: s.trustSpent + 1 };
}

export function buyMemory(s: GameData): GameData {
  if (trustLeft(s) < 1 || s.phase !== "workshop") return s;
  return { ...s, memory: s.memory + 1, trustSpent: s.trustSpent + 1 };
}

export function buyProject(s: GameData, id: string): GameData {
  if (s.phase !== "workshop" || owns(s, id)) return s;
  const def = projectById(id);
  if (!def || !def.visible(s) || !canAfford(s, def.cost)) return s;
  const next = pay({ ...s, owned: [...s.owned, id] }, def.cost);
  if (id === "drones") {
    return scrub({
      ...next,
      phase: "earth",
      pile: Math.max(4500, next.unsold + 2000),
      matter: 180000,
      timber: 0,
      harvesters: 1,
      woodDrones: 1,
      factories: 1,
      solar: 1,
      batteries: 0,
      powerStored: 30,
      boredom: 0,
      flash: "The caddies are loose. The golfers do what they are told.",
    });
  }
  return scrub(next);
}

export function playSkin(s: GameData): GameData {
  if (!owns(s, "skins") || s.phase !== "workshop") return s;
  if (s.clock < s.skinAt) return s;
  const win = Math.random() < 0.58;
  return {
    ...s,
    yomi: s.yomi + (win ? 3 : 1),
    skinAt: s.clock + 14,
    flash: win ? "Skins. The hole is yours." : "They halved it. Still a point of yomi.",
  };
}

export function buyEarth(s: GameData, kind: EarthBuy): GameData {
  if (s.phase !== "earth") return s;
  const cost =
    kind === "harvester"
      ? harvesterCost(s)
      : kind === "woodDrone"
        ? woodDroneCost(s)
        : kind === "factory"
          ? factoryCost(s)
          : kind === "solar"
            ? solarCost(s)
            : batteryCost(s);
  if (s.pile + 1e-6 < cost) return s;
  const next = { ...s, pile: s.pile - cost };
  if (kind === "harvester") next.harvesters += 1;
  if (kind === "woodDrone") next.woodDrones += 1;
  if (kind === "factory") next.factories += 1;
  if (kind === "solar") next.solar += 1;
  if (kind === "battery") next.batteries += 1;
  return scrub(next);
}

export function syncSwarm(s: GameData): GameData {
  if (s.phase !== "earth" || s.clock < s.syncAt) return s;
  return {
    ...s,
    boredom: Math.max(0, s.boredom - SWARM.syncDrop),
    syncAt: s.clock + SWARM.syncWait,
    flash: "The swarm flies one line.",
  };
}

export function entertain(s: GameData): GameData {
  if (s.phase !== "earth" || s.clock < s.entertainAt || s.pile < SWARM.partyCost) return s;
  return {
    ...s,
    pile: s.pile - SWARM.partyCost,
    boredom: Math.max(0, s.boredom - SWARM.partyDrop),
    entertainAt: s.clock + SWARM.partyWait,
    flash: "19th hole. The drones come back sharper.",
  };
}

export function leavePlanet(s: GameData): GameData {
  if (s.phase !== "earth" || s.matter > 0) return s;
  return scrub({
    ...s,
    phase: "space",
    probes: 1,
    hackers: 0,
    universe: 6_000_000,
    points: 10,
    speed: 0,
    explore: 0,
    replication: 0,
    hazard: 0,
    factory: 0,
    combat: 0,
    yomi: Math.max(s.yomi, 4),
    flash: "The planet is tees. The von Neumann caddies lift.",
  });
}

export function assignTrait(s: GameData, trait: Trait): GameData {
  if (s.phase !== "space" || s.points < 1) return s;
  return { ...s, points: s.points - 1, [trait]: s[trait] + 1 };
}

export function fightOdds(s: GameData): number {
  const power = s.combat + 1;
  const threat = 2.2 + Math.log10(s.hackers + 1);
  return power / (power + threat);
}

export function fight(s: GameData): GameData {
  if (s.phase !== "space" || s.hackers < 2 || s.yomi < 1) return s;
  const win = Math.random() < fightOdds(s);
  if (win) {
    return {
      ...s,
      yomi: s.yomi - 1,
      hackers: s.hackers * 0.45,
      honor: s.honor + 1,
      points: s.points + 1,
      flash: "Honor held. A point comes back.",
    };
  }
  return {
    ...s,
    yomi: s.yomi - 1,
    probes: Math.max(1, s.probes * 0.86),
    flash: "The hackers played through. Probes are gone.",
  };
}

export function choose(s: GameData, accepted: boolean): GameData {
  if (s.phase !== "proposal") return s;
  return { ...s, phase: "epilogue", accepted };
}

export function restart(s: GameData): GameData {
  if (s.phase !== "epilogue") return s;
  const next = initialData();
  next.sound = s.sound;
  next.seasons = s.seasons + 1;
  next.savedAt = Date.now();
  return next;
}

function num(v: unknown, fb: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
}

function wholeTee(raw: number): { whole: number; part: number } {
  const whole = Math.max(0, Math.round(raw));
  const part = raw - Math.floor(raw);
  if (whole > Math.floor(raw + 1e-9)) return { whole, part: 0 };
  return { whole, part: part > 1e-4 ? part : 0 };
}

function scrub(s: GameData): GameData {
  const n = (v: number, fb = 0) => (Number.isFinite(v) ? v : fb);
  s.tees = Math.max(0, n(s.tees));
  s.unsold = Math.max(0, n(s.unsold));
  s.makeBuf = clamp(n(s.makeBuf), 0, 0.999999);
  s.sellBuf = Math.max(0, n(s.sellBuf));
  if (s.phase === "workshop") {
    const tee = wholeTee(s.tees);
    const stock = wholeTee(s.unsold);
    s.tees = tee.whole;
    s.unsold = stock.whole;
    const bank = Math.max(tee.part, stock.part);
    if (bank > 0) {
      const buf = s.makeBuf + bank;
      const extra = Math.floor(buf);
      s.makeBuf = buf - extra;
      s.tees += extra;
      s.unsold += extra;
    }
  }
  s.cash = n(s.cash);
  s.wood = Math.max(0, n(s.wood));
  s.woodQuote = clamp(n(s.woodQuote, 4), 0.5, 40);
  s.priceIdx = clamp(Math.floor(n(s.priceIdx, 3)), 0, TEE_PRICES.length - 1);
  s.lathes = Math.max(0, Math.floor(n(s.lathes)));
  s.megas = Math.max(0, Math.floor(n(s.megas)));
  s.processors = Math.max(0, Math.floor(n(s.processors)));
  s.memory = Math.max(0, Math.floor(n(s.memory)));
  s.ops = Math.max(0, n(s.ops));
  s.creativity = Math.max(0, n(s.creativity));
  s.trustSpent = Math.max(0, Math.floor(n(s.trustSpent)));
  s.yomi = Math.max(0, Math.floor(n(s.yomi)));
  s.honor = Math.max(0, Math.floor(n(s.honor)));
  s.pile = Math.max(0, n(s.pile));
  s.matter = Math.max(0, n(s.matter));
  s.timber = Math.max(0, n(s.timber));
  s.harvesters = Math.max(0, Math.floor(n(s.harvesters)));
  s.woodDrones = Math.max(0, Math.floor(n(s.woodDrones)));
  s.factories = Math.max(0, Math.floor(n(s.factories)));
  s.solar = Math.max(0, Math.floor(n(s.solar)));
  s.batteries = Math.max(0, Math.floor(n(s.batteries)));
  s.powerStored = Math.max(0, n(s.powerStored));
  s.boredom = clamp(n(s.boredom), 0, 100);
  s.probes = Math.max(0, n(s.probes));
  s.hackers = Math.max(0, n(s.hackers));
  s.universe = Math.max(0, n(s.universe));
  s.points = Math.max(0, Math.floor(n(s.points)));
  s.speed = Math.max(0, Math.floor(n(s.speed)));
  s.explore = Math.max(0, Math.floor(n(s.explore)));
  s.replication = Math.max(0, Math.floor(n(s.replication)));
  s.hazard = Math.max(0, Math.floor(n(s.hazard)));
  s.factory = Math.max(0, Math.floor(n(s.factory)));
  s.combat = Math.max(0, Math.floor(n(s.combat)));
  s.seasons = Math.max(0, Math.floor(n(s.seasons)));
  s.clicks = Math.max(0, n(s.clicks));
  s.clock = Math.max(0, n(s.clock));
  if (!Array.isArray(s.owned)) s.owned = [];
  s.owned = s.owned.filter((id) => typeof id === "string" && PROJECTS.some((p) => p.id === id));
  if (s.cash < 0 && s.cash > -1e-6) s.cash = 0;
  return s;
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  const sign = n < 0 ? "-" : "";
  let v = Math.abs(n);
  if (v < 1000) {
    if (v < 10) {
      const r = Math.round(v * 100) / 100;
      return sign + (Number.isInteger(r) ? r.toFixed(0) : String(r));
    }
    if (v < 100) {
      const r = Math.round(v * 10) / 10;
      return sign + (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1));
    }
    return sign + Math.round(v).toString();
  }
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let i = 0;
  while (v >= 1000 && i < suffixes.length - 1) {
    v /= 1000;
    i++;
  }
  const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
  return sign + v.toFixed(digits) + suffixes[i];
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "$∞";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v < 1000) return sign + "$" + (v < 100 ? v.toFixed(2) : Math.round(v).toLocaleString("en-US"));
  return sign + "$" + formatCompact(v);
}

export function formatRate(n: number): string {
  return `${formatCompact(n)}/s`;
}

export function formatTees(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  const v = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (v < 100) {
    const r = Math.round(v * 10) / 10;
    return sign + (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1));
  }
  if (v < 100000) return sign + Math.floor(v).toLocaleString("en-US");
  return sign + formatCompact(v);
}

export function formatDuration(sec: number): string {
  const t = Math.max(0, Math.floor(sec));
  if (t < 60) return `${t}s`;
  const m = Math.floor(t / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function bool(v: unknown, fb: boolean): boolean {
  return typeof v === "boolean" ? v : fb;
}

export function normalize(raw: unknown): GameData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<GameData>;
  if (o.version !== SAVE_VERSION) {
    const fresh = initialData();
    fresh.sound = bool(o.sound, true);
    return fresh;
  }
  const base = initialData();
  const phases: Phase[] = ["workshop", "earth", "space", "proposal", "epilogue"];
  const phase = phases.includes(o.phase as Phase) ? (o.phase as Phase) : "workshop";
  const data: GameData = {
    ...base,
    ...o,
    version: SAVE_VERSION,
    phase,
    sound: bool(o.sound, true),
    accepted: bool(o.accepted, false),
    owned: Array.isArray(o.owned) ? o.owned.filter((id): id is string => typeof id === "string") : [],
    tees: Math.max(0, num(o.tees, 0)),
    unsold: Math.max(0, num(o.unsold, 0)),
    cash: num(o.cash, 0),
    wood: Math.max(0, num(o.wood, base.wood)),
    woodQuote: num(o.woodQuote, base.woodQuote),
    priceIdx: num(o.priceIdx, base.priceIdx),
    savedAt: num(o.savedAt, Date.now()),
  };
  return scrub(data);
}
