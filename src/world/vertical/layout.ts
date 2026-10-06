import type { SectionId } from '../../content/types';
import { OBJECTS, TILES, UNITS_PER_PX, propSize, type BuildingAsset, type ChamberAsset, type PropName } from './assets';

/**
 * The vertical world: one tall column that starts at the floating island,
 * pans across the surface village and descends through the caves.
 *
 * Everything here is pure: given the viewport and the measured HTML content,
 * it places the world, the content blocks, the camera track and the
 * adventurer's path. Scroll position `s` (document pixels) drives the camera
 * along a piecewise-linear track; while the track is vertical, one document
 * pixel equals one screen pixel of world travel, so HTML placed with
 * `docTop()` stays locked to the world without any scroll-triggered motion.
 */

export interface Viewport { width: number; height: number }

/** Measured heights in CSS pixels, keyed by content block. */
export type ContentHeights = Partial<Record<string, number>>;

export type Biome = 'upper' | 'wet' | 'mushroom' | 'lava';
export type ChamberZone = 'skills' | 'services' | 'mushroom' | 'contact';
export type PathMode = 'walk' | 'fall' | 'climb';

export interface Rect { x1: number; y1: number; x2: number; y2: number }

export interface PlacedBuilding {
  id: string;
  asset: BuildingAsset;
  x: number;
  top: number;
  width: number;
  height: number;
  door?: Rect;
}

export interface PlacedChamber {
  zone: ChamberZone;
  asset: ChamberAsset;
  biome: Biome;
  x: number;
  top: number;
  width: number;
  height: number;
  floorY: number;
  walk: [number, number];
  restX: number;
}

export interface PlacedProp {
  prop: PropName;
  /** Horizontal centre and bottom edge. */
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  /** Hanging props are anchored by their top edge instead. */
  hanging?: boolean;
  layer: 'back' | 'front';
}

export interface Span { y1: number; y2: number; biome: Biome }

export interface PathNode { x: number; y: number; mode: PathMode; length: number }

export interface CameraKey { s: number; x: number; y: number }

export interface Stop { s: number; param: number }

export interface ProjectMarker { id: string; centerX: number; bottomY: number }

export interface WorldLayout {
  viewport: Viewport;
  scale: number;
  mobile: boolean;
  /** Visible world size in world units. */
  view: { width: number; height: number };
  /** Horizontal fraction of the screen where the traveller column sits. */
  focusX: number;
  surfaceY: number;
  buildings: PlacedBuilding[];
  props: PlacedProp[];
  shaft: { x: number; top: number; ropeX: number };
  rope: { x: number; y1: number; y2: number };
  bands: Span[];
  caverns: Span[];
  chambers: PlacedChamber[];
  ground: { y1: number; y2: number };
  bounds: { x1: number; x2: number; bottom: number };
  camera: CameraKey[];
  path: PathNode[];
  stops: Stop[];
  pan: { start: number; end: number; cameraY: number };
  content: {
    about: number;
    skills: number;
    services: number;
    contact: number;
    projects: { top: number; height: number; heading: ProjectMarker; cards: ProjectMarker[] };
  };
  sections: Record<SectionId, number>;
  documentHeight: number;
}

/** Island geometry, in the coordinates used by the existing island scene. */
export const ISLAND = {
  width: 1774,
  floor: 464,
  bottom: 760,
  restX: 440,
  restY: 455,
  dropX: 70,
  /** Exterior profile from the rest point to the western edge. */
  profile: [[440, 455], [420, 455], [380, 437], [340, 431], [300, 415], [260, 394], [220, 393], [180, 406], [140, 415], [104, 424]] as const,
};

const PROJECT_BUILDINGS: ReadonlyArray<[string, BuildingAsset]> = [
  ['senda', 'building-senda'],
  ['labor-legislativa', 'building-legislativa'],
  ['cadena-arrastre', 'building-lomaton'],
  ['senda-skill', 'building-skill'],
  ['construction', 'building-construction'],
];

const CHAMBERS: ReadonlyArray<{ zone: ChamberZone; asset: ChamberAsset; biome: Biome; rope: number }> = [
  { zone: 'skills', asset: 'chamber-inventory', biome: 'upper', rope: 0.3 },
  { zone: 'services', asset: 'chamber-workshop', biome: 'wet', rope: 0.78 },
  { zone: 'mushroom', asset: 'chamber-mushroom', biome: 'mushroom', rope: 0.5 },
  { zone: 'contact', asset: 'chamber-refuge', biome: 'lava', rope: 0.42 },
];

const FIRST_BUILDING_X = 520;
const BUILDING_GAP = 160;
const BAND_HEIGHT = 210;
const BOTTOM_BAND = 380;
const CAVERN_PAD = 90;
/** Screen fractions: island floor on load, surface ground while panning, traveller while descending. */
const ISLAND_SCREEN_Y = 0.56;
const SURFACE_SCREEN_Y = 0.78;
const DESCENT_SCREEN_Y = 0.62;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function worldScale(viewport: Viewport): { scale: number; mobile: boolean } {
  const mobile = viewport.width < 700;
  const scale = mobile
    ? clamp(viewport.width / 600, 0.55, 1)
    : Math.min(viewport.width / 1810, viewport.height / 950, 1.1);
  return { scale: Math.max(0.2, scale), mobile };
}

export function buildWorldLayout(viewport: Viewport, heights: ContentHeights = {}): WorldLayout {
  const safeViewport = {
    width: Math.max(1, Number.isFinite(viewport.width) ? viewport.width : 1),
    height: Math.max(1, Number.isFinite(viewport.height) ? viewport.height : 1),
  };
  const { scale, mobile } = worldScale(safeViewport);
  const W = safeViewport.width / scale;
  const H = safeViewport.height / scale;
  const toWorld = (key: string) => Math.max(0, heights[key] ?? 0) / scale;
  const focusX = mobile ? 0.5 : 0.36;

  // --- Sky: the island and the "Sobre mí" panel -------------------------
  const cameraY0 = ISLAND.floor - ISLAND_SCREEN_Y * H;
  const aboutTop = mobile ? ISLAND.bottom + 24 : cameraY0 + 0.16 * H;
  const aboutBottom = aboutTop + toWorld('about');
  const surfaceY = Math.round(Math.max(
    1750,
    aboutBottom + (SURFACE_SCREEN_Y + 0.1) * H,
    ISLAND.bottom + (SURFACE_SCREEN_Y + 0.35) * H,
  ));
  const cameraYSurface = surfaceY - SURFACE_SCREEN_Y * H;

  // --- Surface village --------------------------------------------------
  const buildings: PlacedBuilding[] = [];
  let cursor = FIRST_BUILDING_X;
  for (const [id, asset] of PROJECT_BUILDINGS) {
    const art = OBJECTS[asset];
    const width = art.width * UNITS_PER_PX;
    const height = art.height * UNITS_PER_PX;
    const top = surfaceY - (art.floor ?? art.height) * UNITS_PER_PX;
    const door = art.door
      ? { x1: cursor + art.door[0] * UNITS_PER_PX, y1: top + art.door[1] * UNITS_PER_PX, x2: cursor + art.door[2] * UNITS_PER_PX, y2: top + art.door[3] * UNITS_PER_PX }
      : undefined;
    buildings.push({ id, asset, x: cursor, top, width, height, door });
    cursor += width + BUILDING_GAP;
  }
  const entrance = OBJECTS['shaft-entrance'];
  const shaftX = cursor + 40;
  const ropeX = shaftX + (entrance.rope ?? 0) * UNITS_PER_PX;
  const shaftTop = surfaceY - (entrance.floor ?? 0) * UNITS_PER_PX;

  const groundTile = TILES['surface-ground'];
  const groundTop = surfaceY - (groundTile.floor ?? 0) * UNITS_PER_PX;
  const ground = { y1: groundTop, y2: groundTop + groundTile.height * UNITS_PER_PX };

  // --- Caves --------------------------------------------------------------
  const bands: Span[] = [];
  const caverns: Span[] = [];
  const chambers: PlacedChamber[] = [];
  const contentTops: Partial<Record<ChamberZone, number>> = {};
  let y = ground.y2 - 40;
  for (const spec of CHAMBERS) {
    bands.push({ y1: y, y2: y + BAND_HEIGHT, biome: spec.biome });
    y += BAND_HEIGHT;
    const art = OBJECTS[spec.asset];
    const width = art.width * UNITS_PER_PX;
    const height = art.height * UNITS_PER_PX;
    const [walkStart, walkEnd] = art.walk ?? [0, art.width];
    const ropeInArt = (walkStart + spec.rope * (walkEnd - walkStart)) * UNITS_PER_PX;
    const x = ropeX - ropeInArt;
    const walk: [number, number] = [x + walkStart * UNITS_PER_PX + 20, x + walkEnd * UNITS_PER_PX - 20];
    const walkMid = (walk[0] + walk[1]) / 2;
    const restX = Math.abs(walkMid - ropeX) < 90
      ? clamp(ropeX + (spec.rope < 0.5 ? 150 : -150), walk[0], walk[1])
      : walkMid;
    const contentHeight = spec.zone === 'mushroom' ? 0 : toWorld(spec.zone);
    const top = y;
    let chamberTop: number;
    let cavernHeight: number;
    if (mobile && contentHeight > 0) {
      chamberTop = top + CAVERN_PAD;
      contentTops[spec.zone] = chamberTop + height + 30;
      cavernHeight = chamberTop + height + 30 + contentHeight + CAVERN_PAD - top;
    } else {
      // Keep the rock close around the chamber; tall content may overlap the
      // neighbouring bands, but consecutive panels keep a gap between them.
      cavernHeight = Math.max(height + 2 * CAVERN_PAD, contentHeight + 80 - BAND_HEIGHT);
      chamberTop = top + (cavernHeight - height) / 2;
      contentTops[spec.zone] = top + (cavernHeight - contentHeight) / 2;
    }
    caverns.push({ y1: top, y2: top + cavernHeight, biome: spec.biome });
    chambers.push({
      zone: spec.zone, asset: spec.asset, biome: spec.biome, x, top: chamberTop, width, height,
      floorY: chamberTop + (art.floor ?? art.height) * UNITS_PER_PX, walk, restX,
    });
    y = top + cavernHeight;
  }
  bands.push({ y1: y, y2: y + BOTTOM_BAND, biome: 'lava' });
  const bottom = y + BOTTOM_BAND;
  const lastChamber = chambers[chambers.length - 1];

  // --- Camera track -------------------------------------------------------
  const cameraXStart = mobile ? ISLAND.dropX - 0.3 * W : -(W - ISLAND.width) / 2;
  const cameraXEnd = ropeX - focusX * W;
  const panStart = Math.max(0, (cameraYSurface - cameraY0) * scale);
  const panEnd = panStart + Math.max(0, cameraXEnd - cameraXStart) * scale;
  const cameraYEnd = Math.max(cameraYSurface, bottom - H);
  const scrollEnd = panEnd + (cameraYEnd - cameraYSurface) * scale;
  const camera: CameraKey[] = [
    { s: 0, x: cameraXStart, y: cameraY0 },
    { s: panStart, x: cameraXStart, y: cameraYSurface },
    { s: panEnd, x: cameraXEnd, y: cameraYSurface },
    { s: scrollEnd, x: cameraXEnd, y: cameraYEnd },
  ];
  // Below the surface the track is vertical again: document and world move together.
  const docTop = (worldY: number) => panEnd + (worldY - cameraYSurface) * scale;
  const sAtDepth = (worldY: number) => clamp(docTop(worldY), panEnd, scrollEnd);

  // --- Adventurer path ----------------------------------------------------
  const path: PathNode[] = [];
  const push = (x: number, nodeY: number, mode: PathMode) => {
    const previous = path[path.length - 1];
    const length = previous ? previous.length + Math.hypot(x - previous.x, nodeY - previous.y) : 0;
    path.push({ x, y: nodeY, mode, length });
    return length;
  };
  const paramRest = push(ISLAND.restX, ISLAND.restY, 'walk');
  for (const [px, py] of ISLAND.profile.slice(1)) push(px, py, 'walk');
  const paramEdge = push(ISLAND.dropX, ISLAND.profile[ISLAND.profile.length - 1][1], 'walk');
  const paramLanding = push(ISLAND.dropX, surfaceY, 'fall');
  const paramShaft = push(ropeX, surfaceY, 'walk');
  const chamberParams: Array<{ arrive: number; rest: number; leave: number }> = [];
  for (const chamber of chambers) {
    const arrive = push(ropeX, chamber.floorY, 'climb');
    const rest = push(chamber.restX, chamber.floorY, 'walk');
    const leave = chamber === lastChamber ? rest : push(ropeX, chamber.floorY, 'walk');
    chamberParams.push({ arrive, rest, leave });
  }
  const surfaceParam = (x: number) => paramLanding + clamp(x, ISLAND.dropX, ropeX) - ISLAND.dropX;

  const vh = safeViewport.height;
  const stops: Stop[] = [];
  const stop = (s: number, param: number) => {
    const previous = stops[stops.length - 1];
    stops.push({ s: previous ? Math.max(s, previous.s + 1) : Math.max(0, s), param });
  };
  stop(0, paramRest);
  stop(panStart * 0.1, paramEdge);
  stop(panStart, paramLanding);
  const panLead = Math.min(panEnd, panStart + 0.15 * vh);
  stop(panLead, surfaceParam(cameraXAt(camera, panLead) + focusX * W));
  stop(panEnd, paramShaft);
  chambers.forEach((chamber, index) => {
    const sFloor = sAtDepth(chamber.floorY - DESCENT_SCREEN_Y * H);
    const params = chamberParams[index];
    // Stay in the chamber while its content is being read, then head down.
    const cavern = caverns[index];
    const leaveAt = Math.max(sFloor + 0.3 * vh, sAtDepth(cavern.y2 - 0.75 * H));
    stop(sFloor - 0.08 * vh, params.arrive);
    stop(sFloor + 0.06 * vh, params.rest);
    if (params.leave !== params.rest) {
      stop(leaveAt - 0.24 * vh, params.rest);
      stop(leaveAt, params.leave);
    }
  });
  stop(scrollEnd, chamberParams[chamberParams.length - 1].rest);

  // --- HTML content ---------------------------------------------------------
  const cards: ProjectMarker[] = buildings
    .filter((building) => building.id !== 'construction')
    .map((building) => ({ id: building.id, centerX: building.x + building.width / 2, bottomY: building.top - 14 }));
  const heading: ProjectMarker = { id: 'projects-heading', centerX: FIRST_BUILDING_X - 260, bottomY: surfaceY - 250 };
  const sectionAt = (zone: ChamberZone) => {
    const cavern = caverns[CHAMBERS.findIndex((spec) => spec.zone === zone)];
    // Desktop centres the cavern; on a phone, arrive with the chamber in view and read on below it.
    return sAtDepth(mobile ? cavern.y1 + 20 : (cavern.y1 + cavern.y2) / 2 - 0.5 * H);
  };

  return {
    viewport: safeViewport,
    scale,
    mobile,
    view: { width: W, height: H },
    focusX,
    surfaceY,
    buildings,
    props: surfaceProps(buildings, surfaceY, shaftX).concat(caveProps(caverns, chambers, ropeX)),
    shaft: { x: shaftX, top: shaftTop, ropeX },
    rope: { x: ropeX, y1: surfaceY - 40, y2: lastChamber.floorY },
    bands,
    caverns,
    chambers,
    ground,
    bounds: { x1: Math.min(cameraXStart, -200) - 600, x2: Math.max(ropeX + W, cameraXEnd + W) + 600, bottom },
    camera,
    path,
    stops,
    pan: { start: panStart, end: panEnd, cameraY: cameraYSurface },
    content: {
      about: (aboutTop - cameraY0) * scale,
      skills: docTop(contentTops.skills ?? 0),
      services: docTop(contentTops.services ?? 0),
      contact: docTop(contentTops.contact ?? 0),
      projects: { top: panStart, height: panEnd - panStart + vh, heading, cards },
    },
    sections: {
      about: 0,
      projects: panStart,
      skills: sectionAt('skills'),
      services: sectionAt('services'),
      contact: sectionAt('contact'),
    },
    documentHeight: Math.ceil(scrollEnd + vh),
  };
}

function interpolate<T extends { s: number }>(keys: readonly T[], s: number, pick: (key: T) => number): number {
  const first = keys[0];
  if (!first) return 0;
  if (s <= first.s) return pick(first);
  for (let index = 1; index < keys.length; index += 1) {
    const previous = keys[index - 1];
    const next = keys[index];
    if (s <= next.s) {
      const span = next.s - previous.s;
      const progress = span <= 0 ? 1 : (s - previous.s) / span;
      return pick(previous) + (pick(next) - pick(previous)) * progress;
    }
  }
  return pick(keys[keys.length - 1]);
}

function cameraXAt(keys: readonly CameraKey[], s: number): number {
  return interpolate(keys, s, (key) => key.x);
}

/** Top-left corner of the view, in world units, for a scroll position. */
export function cameraAt(layout: Pick<WorldLayout, 'camera'>, s: number): { x: number; y: number } {
  return { x: interpolate(layout.camera, s, (key) => key.x), y: interpolate(layout.camera, s, (key) => key.y) };
}

/** Where along the path the adventurer is heading for this scroll position. */
export function targetParam(layout: Pick<WorldLayout, 'stops'>, s: number): number {
  return interpolate(layout.stops, s, (stop) => stop.param);
}

export function pathLength(layout: Pick<WorldLayout, 'path'>): number {
  return layout.path[layout.path.length - 1]?.length ?? 0;
}

/** Position on the path, with the mode of the segment it lies on. */
export function pathPoint(layout: Pick<WorldLayout, 'path'>, param: number): { x: number; y: number; mode: PathMode } {
  const { path } = layout;
  const first = path[0];
  if (!first) return { x: 0, y: 0, mode: 'walk' };
  if (param <= 0) return { x: first.x, y: first.y, mode: path[1]?.mode ?? 'walk' };
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    // A node belongs to the segment that starts there: landing ends the fall.
    if (param < next.length) {
      const span = next.length - previous.length;
      const progress = span <= 0 ? 1 : (param - previous.length) / span;
      return { x: previous.x + (next.x - previous.x) * progress, y: previous.y + (next.y - previous.y) * progress, mode: next.mode };
    }
  }
  const last = path[path.length - 1];
  return { x: last.x, y: last.y, mode: last.mode };
}

/** Path parameter of a point on the surface walk, e.g. in front of a door. */
export function paramOnSurface(layout: Pick<WorldLayout, 'path' | 'surfaceY'>, x: number): number {
  const index = layout.path.findIndex((node) => node.mode === 'fall');
  const landing = layout.path[index];
  const shaft = layout.path[index + 1];
  if (!landing || !shaft) return 0;
  return landing.length + Math.min(shaft.x, Math.max(landing.x, x)) - landing.x;
}

/** Path parameter of the island rest point; physics takes over there. */
export const ISLAND_REST_PARAM = 0;

export function activeSection(layout: Pick<WorldLayout, 'sections'>, s: number): SectionId {
  const order: SectionId[] = ['about', 'projects', 'skills', 'services', 'contact'];
  let active: SectionId = 'about';
  for (let index = 1; index < order.length; index += 1) {
    const previous = layout.sections[order[index - 1]];
    const current = layout.sections[order[index]];
    if (s >= previous + (current - previous) * 0.5) active = order[index];
  }
  return active;
}

function surfaceProps(buildings: PlacedBuilding[], surfaceY: number, shaftX: number): PlacedProp[] {
  const props: PlacedProp[] = [];
  const add = (prop: PropName, x: number, layer: PlacedProp['layer'] = 'back', extra: Partial<PlacedProp> = {}) =>
    props.push({ prop, x, y: surfaceY + 2, layer, ...extra });
  const first = buildings[0];
  // Landing meadow west of the village.
  add('pineTall', first.x - 560);
  add('oak', first.x - 380);
  add('well', first.x - 200);
  add('sunflowerA', first.x - 90, 'front');
  add('bushRed', first.x - 40, 'front');
  const gapDecor: PropName[][] = [
    ['lampPost', 'sunflowerB', 'bench'],
    ['lampHanging', 'barrels', 'bushBlue'],
    ['lampPost', 'wheelbarrow', 'sunflowerC'],
    ['planter', 'lampHangingTall', 'mailbox'],
    ['fence', 'pineSmall', 'fencePicket'],
  ];
  buildings.forEach((building, index) => {
    const start = building.x + building.width;
    const decor = gapDecor[index % gapDecor.length];
    decor.forEach((prop, slot) => {
      const x = start + 30 + slot * 50;
      add(prop, x, slot === 1 ? 'front' : 'back');
    });
  });
  add('pineSmall', shaftX + 160);
  add('pineTall', shaftX + 300);
  add('oak', shaftX + 520);
  // Keep props from overlapping the building faces.
  return props.filter((prop) => {
    const half = propSize(prop.prop).width / 2;
    return !buildings.some((building) => prop.x + half > building.x + 6 && prop.x - half < building.x + building.width - 6);
  });
}

function caveProps(caverns: Span[], chambers: PlacedChamber[], ropeX: number): PlacedProp[] {
  const props: PlacedProp[] = [];
  const hanging: Record<Biome, PropName[]> = {
    upper: ['stalactiteA', 'rootsA', 'stalactiteC', 'rootsB'],
    wet: ['vineA', 'stalactiteB', 'vineB', 'rootsA'],
    mushroom: ['stalactiteA', 'stalactiteD', 'stalactiteB'],
    lava: ['stalactiteC', 'stalactiteD', 'stalactiteA'],
  };
  const standing: Record<Biome, PropName[]> = {
    upper: ['stalagmiteA', 'rubble', 'oreGold', 'stalagmiteB'],
    wet: ['stalagmiteB', 'mushroomSmall', 'stalagmiteA'],
    mushroom: ['mushroomCluster', 'crystalPurple', 'mushroomPair', 'crystalCyan'],
    lava: ['rubble', 'stalagmiteC', 'stalagmiteB'],
  };
  const furnishings: Record<Biome, PropName[]> = {
    upper: ['minecart', 'cratePickaxe', 'oreGold'],
    wet: ['beamFrame', 'mushroomPair', 'rubble'],
    mushroom: ['mushroomCluster', 'crystalCyan', 'mushroomPair'],
    lava: ['rubble', 'stalagmiteC', 'oreGold'],
  };
  caverns.forEach((cavern, index) => {
    const chamber = chambers[index];
    // Lived-in details on the cavern floor beside each chamber.
    const floor = cavern.y2 + 8;
    furnishings[cavern.biome].forEach((prop, slot) => {
      const side = slot % 2 === 0 ? -1 : 1;
      const x = side < 0 ? chamber.x - 90 - slot * 70 : chamber.x + chamber.width + 80 + slot * 40;
      props.push({ prop, x, y: floor, layer: 'back', flip: side > 0 });
    });
    const from = chamber.x - 700;
    const to = chamber.x + chamber.width + 900;
    for (let step = 0, x = from; x < to; step += 1, x += 120 + ((step * 53) % 90)) {
      if (Math.abs(x - ropeX) < 70) continue;
      const top = hanging[cavern.biome];
      props.push({ prop: top[step % top.length], x, y: cavern.y1 - 6, hanging: true, layer: 'back', flip: step % 2 === 0 });
      if (step % 2 === 1 && (x < chamber.x - 40 || x > chamber.x + chamber.width + 40)) {
        const bottom = standing[cavern.biome];
        props.push({ prop: bottom[(step >> 1) % bottom.length], x: x + 40, y: cavern.y2 + 8, layer: 'back', flip: step % 4 === 3 });
      }
    }
  });
  return props;
}
