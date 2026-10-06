import manifest from './asset-manifest.json';

export interface ObjectAsset {
  path: string;
  width: number;
  height: number;
  /** Walkable line, in processed pixels from the top of the image. */
  floor?: number;
  /** Empty doorway as [x1, y1, x2, y2] in processed pixels. */
  door?: number[];
  /** Walkable floor span as [x1, x2] in processed pixels. */
  walk?: number[];
  /** Rope column, in processed pixels from the left edge. */
  rope?: number;
}

export interface TileAsset {
  path: string;
  width: number;
  height: number;
  floor?: number;
  rope?: number;
}

type ObjectName = keyof typeof manifest.objects;
type TileName = keyof typeof manifest.tiles;

/** World units per processed pixel; shared by every scene-v3 asset. */
export const UNITS_PER_PX = manifest.unitsPerPx;

export const OBJECTS = manifest.objects as Record<ObjectName, ObjectAsset>;
export const TILES = manifest.tiles as Record<TileName, TileAsset>;

export type BuildingAsset = Extract<ObjectName, `building-${string}`>;
export type ChamberAsset = Extract<ObjectName, `chamber-${string}`>;

/** Named sprites from the separated prop sheets (index order of the QA sheets). */
const sheet = (name: keyof typeof manifest.sheets, index: number) => manifest.sheets[name][index - 1].path;

export const PROPS = {
  lampHanging: sheet('props-surface', 1),
  lampPost: sheet('props-surface', 2),
  lampHangingTall: sheet('props-surface', 3),
  fence: sheet('props-surface', 4),
  fencePicket: sheet('props-surface', 5),
  well: sheet('props-surface', 6),
  signpost: sheet('props-surface', 7),
  sunflowerA: sheet('props-surface', 8),
  sunflowerB: sheet('props-surface', 9),
  sunflowerC: sheet('props-surface', 10),
  bushRed: sheet('props-surface', 11),
  bushBlue: sheet('props-surface', 12),
  wheelbarrow: sheet('props-surface', 13),
  barrels: sheet('props-surface', 14),
  mailbox: sheet('props-surface', 15),
  pineSmall: sheet('props-surface', 16),
  pineTall: sheet('props-surface', 17),
  oak: sheet('props-surface', 18),
  planter: sheet('props-surface', 19),
  bench: sheet('props-surface', 20),
  stalactiteA: sheet('props-cave', 1),
  stalactiteB: sheet('props-cave', 2),
  stalactiteC: sheet('props-cave', 3),
  stalactiteD: sheet('props-cave', 4),
  stalagmiteA: sheet('props-cave', 5),
  stalagmiteB: sheet('props-cave', 6),
  stalagmiteC: sheet('props-cave', 7),
  vineA: sheet('props-cave', 8),
  vineB: sheet('props-cave', 9),
  rootsA: sheet('props-cave', 10),
  rootsB: sheet('props-cave', 11),
  mushroomSmall: sheet('props-cave', 12),
  mushroomPair: sheet('props-cave', 13),
  mushroomCluster: sheet('props-cave', 14),
  crystalPurple: sheet('props-cave', 15),
  crystalCyan: sheet('props-cave', 16),
  minecart: sheet('props-cave', 17),
  cratePickaxe: sheet('props-cave', 18),
  ladder: sheet('props-cave', 19),
  beamFrame: sheet('props-cave', 20),
  torchA: sheet('props-cave', 21),
  torchB: sheet('props-cave', 22),
  rubble: sheet('props-cave', 23),
  oreGold: sheet('props-cave', 25),
} as const;

export type PropName = keyof typeof PROPS;

const sizeByPath = new Map<string, { width: number; height: number }>(
  Object.values(manifest.sheets).flat().map((entry) => [entry.path, { width: entry.width, height: entry.height }]),
);

export function propSize(name: PropName): { width: number; height: number } {
  const size = sizeByPath.get(PROPS[name]);
  if (!size) throw new Error(`Unknown prop ${name}`);
  return { width: size.width * UNITS_PER_PX, height: size.height * UNITS_PER_PX };
}

/** Closed door slabs from the doors sheet, matched to each building's doorway. */
export const DOORS: Record<string, string> = {
  senda: sheet('doors', 1),
  'labor-legislativa': sheet('doors', 3),
  'cadena-arrastre': sheet('doors', 2),
  'senda-skill': sheet('doors', 5),
};

export const SKILL_ICONS = manifest.sheets['skill-icons'].map((entry) => entry.path);

export const CHARACTER_FRAMES = {
  climb: frames('adventurer_climb', manifest.character.climb),
  sit: frames('adventurer_sit', manifest.character.sit),
};

function frames(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    `/assets/adventurer/${folder}/frame-${String(index + 1).padStart(2, '0')}.png`,
  );
}

/** Every texture the vertical world needs, for the scene loader. */
export const VERTICAL_ASSET_PATHS: string[] = [
  ...Object.values(OBJECTS).map((asset) => asset.path),
  ...Object.values(TILES).map((asset) => asset.path),
  ...Object.values(PROPS),
  ...Object.values(DOORS),
  ...CHARACTER_FRAMES.climb,
  ...CHARACTER_FRAMES.sit,
];
