export interface World {
  name: string;
  blurb: string;
  holes: string[];
}

export const WORLDS: World[] = [
  {
    name: "Backyard Range",
    blurb: "The neighbors pretend not to watch.",
    holes: [
      "Clothesline",
      "Sprinkler Head",
      "Maple Dogleg",
      "Compost Corner",
      "Hose Reel",
      "Birdbath",
      "Fence Post",
      "Porch Light",
      "Mower Strip",
      "Birthday Flag",
    ],
  },
  {
    name: "Municipal Loop",
    blurb: "Geese, chili, and a chain-link soul.",
    holes: [
      "Pothole Three",
      "Chainlink",
      "Picnic Shelter",
      "Goose Pond",
      "Range Lights",
      "Cart-Path Crack",
      "Saturday Scramble",
      "Lost-Ball Pines",
      "Chili Window",
      "Last Tee Time",
    ],
  },
  {
    name: "The Club",
    blurb: "Whites after Memorial Day. Don't ask.",
    holes: [
      "Hedge Row",
      "Fountain One",
      "Caddie Yard",
      "Rose Garden",
      "Member's Grill",
      "Oak Allée",
      "Practice Green",
      "Locker Room",
      "Silent Auction",
      "Club Final",
    ],
  },
  {
    name: "High Desert",
    blurb: "Irrigation is a lifestyle.",
    holes: [
      "Saguaro",
      "Mirage",
      "Red Shelf",
      "Canyon Lip",
      "Night Irrigation",
      "Rattler Wash",
      "Adobe Porch",
      "Heat Haze",
      "Oasis Seventeen",
      "Dust Scramble",
    ],
  },
  {
    name: "Saltwind Links",
    blurb: "The ocean keeps the score.",
    holes: [
      "Tide Pool",
      "Dune Grass",
      "Fog Horn",
      "Sea Wall",
      "Kelp Corner",
      "Gull Alley",
      "Driftwood",
      "The Blowout",
      "Lighthouse",
      "Dusk Eighteen",
    ],
  },
  {
    name: "Granite Highlands",
    blurb: "Thin air. Fat lies.",
    holes: [
      "Switchback",
      "Pine Smoke",
      "Granite Shelf",
      "Eagle Nest",
      "Creek Jump",
      "Alpine Cart",
      "Thunderhead",
      "Snow Fence",
      "Valley Glass",
      "Summit Pin",
    ],
  },
  {
    name: "Palmetto Circuit",
    blurb: "Trade winds and a late ferry.",
    holes: [
      "Palm Corridor",
      "Lagoon",
      "Trade Wind",
      "Black Sand",
      "Reef Edge",
      "Monkeypod",
      "Tiki Range",
      "Overwater",
      "Caldera Lip",
      "Last Ferry",
    ],
  },
  {
    name: "Major Week",
    blurb: "Galleries, ropes, and no excuses.",
    holes: [
      "Magnolia Bend",
      "Stone Bridge",
      "Island Green",
      "Cathedral Rough",
      "Rivermouth",
      "Golden Bell",
      "Cypress Wall",
      "Old Town Wind",
      "Pacific Shelf",
      "Sunday Charge",
    ],
  },
  {
    name: "After Dark",
    blurb: "Glow balls and quiet money.",
    holes: [
      "Glow Ball",
      "Firefly",
      "Lantern Cart",
      "Moon Pond",
      "Black Tee",
      "Aurora Rough",
      "Quiet Gallery",
      "Neon Pin",
      "Insomnia Open",
      "Last Light",
    ],
  },
  {
    name: "Far Fairways",
    blurb: "If it has gravity, it has a tee box.",
    holes: [
      "Low Orbit",
      "Crater Lip",
      "Soft Gravity",
      "Ring Bunker",
      "Red Dwarf",
      "Fairway Nebula",
      "Dark Pin",
      "Comet Lie",
      "The Long Tee",
      "Universal Tee",
    ],
  },
];

export function holeFacts(index: number): { par: 3 | 4 | 5; yards: number } {
  const n = Math.min(99, Math.max(0, index));
  const roll = (n * 17 + 5) % 9;
  const par: 3 | 4 | 5 = roll < 2 ? 3 : roll > 6 ? 5 : 4;
  const yards =
    par === 3 ? 118 + ((n * 13) % 90) : par === 4 ? 340 + ((n * 19) % 120) : 500 + ((n * 11) % 90);
  return { par, yards };
}

export interface CourseRef {
  index: number;
  level: number;
  worldIndex: number;
  holeIndex: number;
  world: string;
  hole: string;
  blurb: string;
  par: 3 | 4 | 5;
  yards: number;
}

export function courseRef(index: number): CourseRef {
  const i = Math.min(99, Math.max(0, index));
  const worldIndex = Math.floor(i / 10);
  const holeIndex = i % 10;
  const world = WORLDS[worldIndex];
  const facts = holeFacts(i);
  return {
    index: i,
    level: i + 1,
    worldIndex,
    holeIndex,
    world: world.name,
    hole: world.holes[holeIndex],
    blurb: world.blurb,
    par: facts.par,
    yards: facts.yards,
  };
}

export type MarkKind = "tees" | "cash" | "crate" | "lathe" | "mill" | "wood";

export interface Mark {
  kind: MarkKind;
  goal: number;
  title: string;
  detail: string;
}
