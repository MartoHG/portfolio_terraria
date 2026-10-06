import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { DOORS, OBJECTS, PROPS, TILES, UNITS_PER_PX } from './assets';
import type { Biome, Rect, Span, WorldLayout } from './layout';

const BACKWALL: Record<Biome, keyof typeof TILES> = {
  upper: 'backwall-dirt',
  wet: 'backwall-wet',
  mushroom: 'backwall-mushroom',
  lava: 'backwall-lava',
};

const ROCK: Record<Biome, keyof typeof TILES> = {
  upper: 'rock-fill-upper',
  wet: 'rock-fill-wet',
  mushroom: 'rock-fill-mushroom',
  lava: 'rock-fill-lava',
};

const BACKWALL_TINT: Record<Biome, number> = { upper: 0xb4b0aa, wet: 0x96a09c, mushroom: 0x8a94bc, lava: 0x9c7a6c };

/** Outline colour of rock edges, per biome, so bands read as solid blocks. */
const EDGE: Record<Biome, number> = { upper: 0x1d140d, wet: 0x0f1813, mushroom: 0x0c0d24, lava: 0x120806 };

const Z = {
  backdrop: -1,
  backwall: 0,
  band: 2,
  caveProp: 3,
  chamber: 4,
  tunnel: 5,
  rope: 6,
  building: 7,
  door: 7.5,
  surfaceBack: 8,
  ground: 9,
  surfaceFront: 10,
};

/**
 * Renders the surface village and the caves described by a WorldLayout.
 * Rebuilt whenever the layout changes; between rebuilds only the cave
 * back walls move, for parallax.
 */
interface DoorState {
  sprite: Sprite;
  rect: Rect;
  /** 0 closed … 1 open. */
  progress: number;
  target: number;
}

/** Terraria doors swing on their hinge in a few discrete steps. */
const DOOR_STEPS = 4;
const DOOR_SECONDS = 0.28;

export class VerticalWorld {
  readonly container = new Container();
  /** Lit by the sky: tinted by the day/night cycle. */
  readonly surface = new Container();
  /** Lit by depth and torches only. */
  readonly underground = new Container();
  private backwalls: TilingSprite[] = [];
  private readonly doors = new Map<string, DoorState>();
  private signature = '';

  constructor(private readonly textures: Record<string, Texture>, private readonly onBuilding?: (id: string) => void) {
    this.container.label = 'vertical-world';
    this.surface.label = 'surface';
    this.underground.label = 'underground';
    this.surface.sortableChildren = true;
    this.underground.sortableChildren = true;
    this.container.addChild(this.underground, this.surface);
  }

  build(layout: WorldLayout): void {
    const signature = JSON.stringify([layout.surfaceY, layout.bands, layout.caverns, layout.chambers.map((c) => [c.x, c.top]), layout.bounds]);
    if (signature === this.signature) return;
    this.signature = signature;
    for (const layer of [this.surface, this.underground]) {
      for (const child of layer.removeChildren()) child.destroy({ children: true });
    }
    this.backwalls = [];
    const openDoors = new Map([...this.doors].map(([id, door]) => [id, door.target]));
    this.doors.clear();

    const { x1, x2 } = layout.bounds;
    // Solid darkness behind the whole underground, so no sky shows through edges.
    const backdrop = new Graphics().rect(x1, layout.ground.y1 + 60, x2 - x1, layout.bounds.bottom + 2000 - layout.ground.y1).fill(0x0b0a0f);
    backdrop.zIndex = Z.backdrop;
    backdrop.label = 'underground-backdrop';
    this.underground.addChild(backdrop);
    layout.caverns.forEach((cavern) => this.addBackwall(cavern, x1, x2));
    layout.bands.forEach((band, index) => this.addBand(band, x1, x2, index === 0, index === layout.bands.length - 1));
    this.addGround(layout, x1, x2);
    this.addShaft(layout);
    for (const chamber of layout.chambers) {
      this.addSprite(OBJECTS[chamber.asset].path, chamber.x, chamber.top, Z.chamber, `chamber-${chamber.zone}`, this.underground);
    }
    for (const building of layout.buildings) {
      const sprite = this.addSprite(OBJECTS[building.asset].path, building.x, building.top, Z.building, `building-${building.id}`, this.surface);
      const doorPath = DOORS[building.id];
      if (!building.door || !doorPath) continue;
      if (this.onBuilding) {
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointertap', () => this.onBuilding?.(building.id));
      }
      const door = new Sprite(this.texture(doorPath));
      door.position.set(building.door.x1, building.door.y2);
      door.anchor.set(0, 1);
      door.width = building.door.x2 - building.door.x1;
      door.height = building.door.y2 - building.door.y1;
      door.roundPixels = true;
      door.zIndex = Z.door;
      door.label = `door-${building.id}`;
      this.surface.addChild(door);
      const open = openDoors.get(building.id) ?? 0;
      this.doors.set(building.id, { sprite: door, rect: building.door, progress: open, target: open });
      this.applyDoor(this.doors.get(building.id)!);
    }
    for (const prop of layout.props) {
      const sprite = new Sprite(this.texture(PROPS[prop.prop]));
      sprite.anchor.set(0.5, prop.hanging ? 0 : 1);
      sprite.scale.set(UNITS_PER_PX * (prop.scale ?? 1) * (prop.flip ? -1 : 1), UNITS_PER_PX * (prop.scale ?? 1));
      sprite.position.set(prop.x, prop.y);
      sprite.roundPixels = true;
      const underground = prop.y > layout.surfaceY + 50;
      sprite.zIndex = underground ? Z.caveProp : prop.layer === 'front' ? Z.surfaceFront : Z.surfaceBack;
      sprite.label = `prop-${prop.prop}`;
      (underground ? this.underground : this.surface).addChild(sprite);
    }
  }

  /** Slow parallax for the cave back walls, and door swings. */
  update(cameraX: number, cameraY: number, dt = 0, reducedMotion = false): void {
    for (const wall of this.backwalls) {
      wall.tilePosition.set(cameraX * 0.3, cameraY * 0.3);
    }
    for (const door of this.doors.values()) {
      if (door.progress === door.target) continue;
      const step = reducedMotion ? 1 : dt / DOOR_SECONDS;
      door.progress = door.target > door.progress ? Math.min(door.target, door.progress + step) : Math.max(door.target, door.progress - step);
      this.applyDoor(door);
    }
  }

  setDoorOpen(id: string, open: boolean): void {
    const door = this.doors.get(id);
    if (door) door.target = open ? 1 : 0;
  }

  isDoorOpen(id: string): boolean {
    return (this.doors.get(id)?.progress ?? 0) >= 1;
  }

  private applyDoor(door: DoorState): void {
    // Seen edge-on when open, like a Terraria door: narrow the slab around its hinge.
    const stepped = Math.round(door.progress * DOOR_STEPS) / DOOR_STEPS;
    const width = door.rect.x2 - door.rect.x1;
    door.sprite.width = Math.max(4, width * (1 - 0.82 * stepped));
    door.sprite.tint = stepped > 0 ? 0xc8c0b4 : 0xffffff;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.backwalls = [];
    this.doors.clear();
  }

  private texture(path: string): Texture {
    const texture = this.textures[path];
    if (!texture) throw new Error(`Missing vertical world texture: ${path}`);
    return texture;
  }

  private addSprite(path: string, x: number, y: number, zIndex: number, label: string, parent: Container): Sprite {
    const sprite = new Sprite(this.texture(path));
    sprite.position.set(x, y);
    sprite.scale.set(UNITS_PER_PX);
    sprite.roundPixels = true;
    sprite.zIndex = zIndex;
    sprite.label = label;
    parent.addChild(sprite);
    return sprite;
  }

  private tiling(name: keyof typeof TILES, x: number, y: number, width: number, height: number, zIndex: number, label: string, parent: Container = this.underground): TilingSprite {
    const sprite = new TilingSprite({ texture: this.texture(TILES[name].path), width, height });
    sprite.position.set(x, y);
    sprite.tileScale.set(UNITS_PER_PX);
    sprite.roundPixels = true;
    sprite.zIndex = zIndex;
    sprite.label = label;
    parent.addChild(sprite);
    return sprite;
  }

  private addBackwall(cavern: Span, x1: number, x2: number): void {
    const wall = this.tiling(BACKWALL[cavern.biome], x1, cavern.y1 - 60, x2 - x1, cavern.y2 - cavern.y1 + 120, Z.backwall, `backwall-${cavern.biome}`);
    // Deeper caves are darker; the mushroom glow tints its walls blue, the lava red.
    wall.tint = BACKWALL_TINT[cavern.biome];
    this.backwalls.push(wall);
  }

  private addBand(band: Span, x1: number, x2: number, underGround: boolean, last: boolean): void {
    // The deepest band runs on past the end of the world.
    const y2 = last ? band.y2 + 1200 : band.y2;
    const rock = this.tiling(ROCK[band.biome], x1, band.y1 - 30, x2 - x1, y2 - band.y1 + 60, Z.band, `band-${band.biome}`);
    const top = underGround ? straightEdge(x1, x2, band.y1 - 30) : jaggedEdge(x1, x2, band.y1, band.y1 * 7);
    const bottom = last ? straightEdge(x1, x2, y2).reverse() : jaggedEdge(x1, x2, y2, y2 * 13).reverse();
    const outline = [...top, ...bottom];
    const mask = new Graphics().poly(outline.flat()).fill(0xffffff);
    mask.label = `band-mask-${band.biome}`;
    this.underground.addChild(mask);
    rock.mask = mask;
    const edges = new Graphics();
    if (!underGround) edges.poly(top.flat(), false).stroke({ color: EDGE[band.biome], width: 4, alignment: 1 });
    if (!last) edges.poly(bottom.flat(), false).stroke({ color: EDGE[band.biome], width: 4, alignment: 1 });
    edges.zIndex = Z.band;
    edges.label = `band-edge-${band.biome}`;
    this.underground.addChild(edges);
  }

  private addGround(layout: WorldLayout, x1: number, x2: number): void {
    const { y1, y2 } = layout.ground;
    const ground = this.tiling('surface-ground', x1, y1, x2 - x1, y2 - y1, Z.ground, 'surface-ground', this.surface);
    // Cut the shaft opening out of the ground and give the strip a rocky lower edge.
    const tunnel = TILES['shaft-tunnel'];
    const tunnelLeft = layout.rope.x - (tunnel.rope ?? 0) * UNITS_PER_PX + 10;
    const tunnelRight = tunnelLeft + tunnel.width * UNITS_PER_PX - 20;
    const bottom = jaggedEdge(x1, x2, y2 - 18, 911).reverse();
    const mask = new Graphics()
      .poly([x1, y1, tunnelLeft, y1, tunnelLeft, y2, tunnelRight, y2, tunnelRight, y1, x2, y1, ...bottom.flat()])
      .fill(0xffffff);
    mask.label = 'ground-mask';
    this.surface.addChild(mask);
    ground.mask = mask;
  }

  private addShaft(layout: WorldLayout): void {
    const entrance = OBJECTS['shaft-entrance'];
    const tunnel = TILES['shaft-tunnel'];
    const entranceBottom = layout.shaft.top + entrance.height * UNITS_PER_PX;
    this.addSprite(entrance.path, layout.shaft.x, layout.shaft.top, Z.surfaceFront, 'shaft-entrance', this.surface);
    const tunnelX = layout.rope.x - (tunnel.rope ?? 0) * UNITS_PER_PX;
    const tunnelWidth = tunnel.width * UNITS_PER_PX;
    // Through the ground and the first band, then through each band between caverns.
    const runs: Array<[number, number]> = [[entranceBottom - 4, layout.bands[0].y2 + 20]];
    for (const band of layout.bands.slice(1, -1)) runs.push([band.y1 - 20, band.y2 + 20]);
    runs.forEach(([from, to], index) => {
      const run = this.tiling('shaft-tunnel', tunnelX, from, tunnelWidth, to - from, Z.tunnel, `shaft-tunnel-${index}`);
      run.tilePosition.y = -from;
    });
    const rope = TILES.rope;
    const ropeWidth = rope.width * UNITS_PER_PX;
    this.tiling('rope', layout.rope.x - ropeWidth / 2, entranceBottom - 40, ropeWidth, layout.rope.y2 - entranceBottom + 40, Z.rope, 'rope');
  }
}

/** A blocky, deterministic rock edge: horizontal runs joined by vertical 8-unit steps. */
function jaggedEdge(x1: number, x2: number, y: number, seed: number): Array<[number, number]> {
  let random = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  const next = () => {
    random = (random * 16807) % 2147483647;
    return random / 2147483647;
  };
  const points: Array<[number, number]> = [[x1, y]];
  let offset = 0;
  for (let x = x1 + 24; x < x2; x += 24 + Math.floor(next() * 3) * 8) {
    const following = Math.max(-28, Math.min(28, offset + Math.round((next() - 0.5) * 3) * 8));
    points.push([x, y + offset], [x, y + following]);
    offset = following;
  }
  points.push([x2, y + offset]);
  return points;
}

function straightEdge(x1: number, x2: number, y: number): Array<[number, number]> {
  return [[x1, y], [x2, y]];
}
