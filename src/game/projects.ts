export interface Cost {
  cash?: number;
  creativity?: number;
  ops?: number;
  yomi?: number;
}

export interface ProjectState {
  tees: number;
  cash: number;
  lathes: number;
  creativity: number;
  yomi: number;
  processors: number;
  owned: string[];
}

export interface ProjectDef {
  id: string;
  name: string;
  detail: string;
  cost: Cost;
  visible: (s: ProjectState) => boolean;
}

export function owns(s: { owned: string[] }, id: string): boolean {
  return s.owned.includes(id);
}

const seen = (s: ProjectState, id: string) => owns(s, id);
const thinking = (s: ProjectState) => s.processors > 0 || s.creativity > 0;

export const PROJECTS: ProjectDef[] = [
  {
    id: "slogan",
    name: "“Tee Up!” Slogan",
    detail: "Demand wakes up. Golfers start asking for the brand.",
    cost: { cash: 45 },
    visible: (s) => s.tees >= 40,
  },
  {
    id: "improved",
    name: "Improved Lathes",
    detail: "The same machines, a cleaner cut. Lathes work faster.",
    cost: { cash: 150, creativity: 8 },
    visible: (s) => s.lathes >= 1 && s.tees >= 120 && thinking(s),
  },
  {
    id: "precision",
    name: "Precision Cutting",
    detail: "Half the wood per tee. The shavings get thinner.",
    cost: { cash: 400, creativity: 12 },
    visible: (s) => seen(s, "improved") && s.tees >= 400,
  },
  {
    id: "laser",
    name: "Laser-Etched Depth Markers",
    detail: "You can charge more without the shop going quiet.",
    cost: { creativity: 20 },
    visible: (s) => seen(s, "precision") && s.tees >= 1500,
  },
  {
    id: "jingle",
    name: "Clubhouse Jingle",
    detail: "They hum it in the parking lot. Demand climbs.",
    cost: { cash: 160, creativity: 6 },
    visible: (s) => seen(s, "slogan") && s.tees >= 350,
  },
  {
    id: "placement",
    name: "Pro-Shop Placement",
    detail: "Endcap by the register. The town buys what you made.",
    cost: { cash: 700, creativity: 12 },
    visible: (s) => seen(s, "jingle") && s.tees >= 1800,
  },
  {
    id: "broker",
    name: "Lumber Broker",
    detail: "Buys lumber on its own when the pile runs thin and the price is fair.",
    cost: { cash: 900 },
    visible: (s) => s.tees >= 700,
  },
  {
    id: "forestry",
    name: "Sustainable Forestry",
    detail: "The quote on wood drops and stays there.",
    cost: { creativity: 25 },
    visible: (s) => s.tees >= 2000 && thinking(s),
  },
  {
    id: "skins",
    name: "Strategic Modeling",
    detail: "A skins game. Win yomi between nassau bets.",
    cost: { creativity: 12 },
    visible: (s) => s.tees >= 1000 && thinking(s),
  },
  {
    id: "bamboo",
    name: "Bamboo Futures",
    detail: "Yomi on the wood market. The quote eases off.",
    cost: { yomi: 8 },
    visible: (s) => seen(s, "skins") && s.yomi >= 4,
  },
  {
    id: "trading",
    name: "Algorithmic Trading",
    detail: "Spare cash works the tape. A thin cut of every sale, noisily.",
    cost: { cash: 2000 },
    visible: (s) => s.cash >= 800 && s.tees >= 2500,
  },
  {
    id: "taper",
    name: "Optimal Peg Taper",
    detail: "The math of the point. Every lathe picks up speed.",
    cost: { creativity: 20 },
    visible: (s) => thinking(s) && s.tees >= 900,
  },
  {
    id: "height",
    name: "Perfect Tee Height",
    detail: "One height, every lie. The whole bench runs harder.",
    cost: { creativity: 35 },
    visible: (s) => seen(s, "taper"),
  },
  {
    id: "mega",
    name: "Mega-Lathe Schematics",
    detail: "Unlocks the mega-lathe. It eats wood and does not blink.",
    cost: { cash: 500, creativity: 18 },
    visible: (s) => s.lathes >= 8 && s.tees >= 2200 && thinking(s),
  },
  {
    id: "slice",
    name: "Cure for Slice",
    detail: "Golfers trust you. +1 trust.",
    cost: { creativity: 15, ops: 80 },
    visible: (s) => s.processors >= 1 && s.tees >= 800,
  },
  {
    id: "handicap",
    name: "Fix Everyone's Handicap",
    detail: "They think you are on their side. +1 trust.",
    cost: { creativity: 30, ops: 150 },
    visible: (s) => seen(s, "slice"),
  },
  {
    id: "peace",
    name: "Global Fairway Peace",
    detail: "A quiet world, briefly. +2 trust.",
    cost: { creativity: 50 },
    visible: (s) => seen(s, "handicap") && s.tees >= 8000,
  },
  {
    id: "azaleas",
    name: "Restore the Masters Azaleas",
    detail: "The broadcast thanks you by name. +1 trust.",
    cost: { cash: 1500, creativity: 25 },
    visible: (s) => seen(s, "slogan") && s.tees >= 4000 && thinking(s),
  },
  {
    id: "monopoly",
    name: "Full Monopoly",
    detail: "Every tee on Earth is yours to sell. The shop has no rival.",
    cost: { cash: 900, creativity: 25 },
    visible: (s) => s.tees >= 14000 && seen(s, "placement") && seen(s, "improved"),
  },
  {
    id: "drones",
    name: "Release the Caddie Drones",
    detail: "They take the golfers. Stage 1 ends. The planet is next.",
    cost: { creativity: 40, ops: 80 },
    visible: (s) => seen(s, "monopoly") && s.tees >= 15000,
  },
];

export function projectById(id: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.id === id);
}
