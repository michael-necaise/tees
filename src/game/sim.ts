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
  const season = Math.pow(1.1, s.seasons);
  let lathe = 0.55;
  if (owns(s, "improved")) lathe *= 1.9;
  if (owns(s, "taper")) lathe *= 1.22;
  if (owns(s, "height")) lathe *= 1.18;
  let mega = 6.5;
  if (owns(s, "height")) mega *= 1.2;
  return (s.lathes * lathe + s.megas * mega) * season;
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

export function swarmFactor(s: GameData): number {
  if (s.boredom < 35) return 1;
  return Math.max(0.28, 1 - (s.boredom - 35) / 90);
}

function costLabel(cost: Cost): string {
  const parts: string[] = [];
  if (cost.cash) parts.push(formatMoney(cost.cash));
  if (cost.creativity) parts.push(`${formatCompact(cost.creativity)} creativity`);
  if (cost.ops) parts.push(`${formatCompact(cost.ops)} ops`);
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

export function nextTrait(s: GameData): Trait | null {
  if (s.phase !== "space" || s.points < 1) return null;
  if (s.replication < 4) return "replication";
  if (s.factory < 3) return "factory";
  if (s.explore < 2) return "explore";
  if (s.hazard < 1) return "hazard";
  return "replication";
}

function coachOf(s: GameData): string {
  if (s.phase === "earth") {
    if (s.solar < 1) return "The drones are dark without a solar farm.";
    if (s.factories < 1) return "Buy a tee factory before the drones spend the pile.";
    if (powerProd(s) + 0.2 < powerDraw(s)) return "The fairways are brown. Another solar farm, or the drones stop.";
    if (s.boredom >= 35) return "The swarm wants a round. Sync them, or send them to the 19th hole.";
    if (s.harvesters < 6) return "Harvesters fell the forests. Factories turn that wood into tees.";
    return "Cut the planet down. When the matter is gone, the probes leave.";
  }
  if (s.phase === "space") {
    if (s.replication < 3) return "Replication first. Caddies that cannot copy themselves never reach the next star.";
    if (s.points > 0) return "Factory production next. Then exploration. That is how a universe gets used up.";
    if (s.hackers > s.probes * 0.15 && s.hackers > 8) return "Hackers think tees are for playing. Defend the honor.";
    return "The caddies copy themselves. Matter becomes tees, or it becomes a fight.";
  }
  const nudge = priceNudge(s);
  const unit = (quoteOf(s) / dowelPack()) * woodEach(s);
  if (s.tees < 1) return "Each click is a tee. Wood is the wire. Set a price the shop will pay.";
  if (nudge === 1 && teePrice(s) < unit * 1.45) return "That price is under the wood. Raise it.";
  if (s.wood + 1e-9 < woodEach(s) && s.cash + 1e-6 < dowelCost(s)) return "Broke and out of wood. Sweep the floor.";
  if (nudge === -1) return "The counter is stacked. Lower the price — not under the cost of wood.";
  if (nudge === 1) return "They buy faster than you cut. Raise the price.";
  if (s.wood < woodEach(s) * 8) return "The dowel pile is thin.";
  if (!owns(s, "slogan") && s.tees >= 40) return "Save the till for the Tee Up slogan. Demand is the whole game.";
  if (trustLeft(s) > 0 && s.processors < 1) return "Trust buys a processor. Spare ops become creativity.";
  if (wantLathe(s)) return "An auto-lathe cuts while you look at the price.";
  return "Three stages. This is the workshop. It is supposed to take a while.";
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
  return {
    ...s,
    wood: s.wood - made * per,
    tees: s.tees + made,
    unsold: s.unsold + made,
  };
}

function sell(s: GameData, dt: number): GameData {
  const n = Math.min(s.unsold, demandPerSec(s) * dt);
  if (!(n > 0)) return s;
  let cash = s.cash + n * teePrice(s);
  if (owns(s, "trading")) {
    const swing = (Math.random() - 0.46) * 0.25;
    cash += n * teePrice(s) * 0.12 * (1 + swing);
  }
  return { ...s, unsold: s.unsold - n, cash };
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
  const fell = Math.min(next.matter, next.harvesters * 8 * work * dt);
  next.matter -= fell;
  next.timber += fell;
  const milled = Math.min(next.timber, next.woodDrones * 10 * work * dt);
  next.timber -= milled;
  next.wood += milled;
  const eaten = Math.min(next.wood, next.factories * 12 * work * dt);
  next.wood -= eaten;
  const made = eaten * 2;
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
  const grow = 0.0092 * (1 + next.replication * 0.12);
  const loss = 0.0065 / (1 + next.hazard * 0.4);
  const drift = 0.0035 / (1 + next.combat * 0.32);
  const find = (0.55 + next.explore * 0.32 + next.speed * 0.1) * (0.4 + next.factory * 0.22);
  const consume = Math.min(next.universe, next.probes * find * dt);
  next.universe = Math.max(0, next.universe - consume);
  next.tees += consume;
  const born = next.probes * grow * dt;
  const died = next.probes * loss * dt;
  const turned = next.probes * drift * dt;
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
  return { ...s, boredom: Math.max(0, s.boredom - 32), syncAt: s.clock + 26, flash: "The swarm flies one line." };
}

export function entertain(s: GameData): GameData {
  if (s.phase !== "earth" || s.clock < s.entertainAt || s.pile < 900) return s;
  return {
    ...s,
    pile: s.pile - 900,
    boredom: Math.max(0, s.boredom - 45),
    entertainAt: s.clock + 20,
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

export function fight(s: GameData): GameData {
  if (s.phase !== "space" || s.hackers < 2 || s.yomi < 1) return s;
  const power = s.combat + 1;
  const threat = 2.2 + Math.log10(s.hackers + 1);
  const win = Math.random() < power / (power + threat);
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

function scrub(s: GameData): GameData {
  const n = (v: number, fb = 0) => (Number.isFinite(v) ? v : fb);
  s.tees = Math.max(0, n(s.tees));
  s.unsold = Math.max(0, n(s.unsold));
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
