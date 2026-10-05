import { Container, Rectangle, Sprite, Texture } from 'pixi.js';

const WORKSHOP_PATH = '/assets/scene-v2/workshop-v2.png';
const ANIMATION_FRAME_COUNTS = {
  door_open: 5,
  door_close: 5,
  fireplace: 5,
  window_light: 6,
  chimney_smoke: 6,
} as const;

type AnimationName = keyof typeof ANIMATION_FRAME_COUNTS;

function framePaths(name: AnimationName): string[] {
  return Array.from({ length: ANIMATION_FRAME_COUNTS[name] }, (_, index) =>
    `/assets/modular/animations/${name}/frame-${String(index + 1).padStart(2, '0')}.png`,
  );
}

export const HOUSE_ASSET_PATHS = [
  WORKSHOP_PATH,
  ...Object.keys(ANIMATION_FRAME_COUNTS).flatMap((name) => framePaths(name as AnimationName)),
];

export interface HousePlatform {
  x1: number;
  x2: number;
  y: number;
}

export interface HouseSolid {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface HouseOptions {
  x: number;
  groundY: number;
  /** Relative world-size multiplier; 2 gives the authored 540-unit footprint. */
  scale?: number;
  onDoor?: () => void;
}

interface AnimationTrack {
  sprite: Sprite;
  frames: Texture[];
  fps: number;
  loop: boolean;
  elapsed: number;
  phase: number;
}

// Robust alpha bounds measured from workshop-v2.png. Keep the original texture
// intact so its native pixel-art proportions and all interior detail survive.
const ART_BOUNDS = { left: 23, right: 1498 };
const FLOOR_PX = 914;
const UPPER_FLOOR_PX = 597;
const DEFAULT_WIDTH = 540;
const DOOR_PX = { left: 132, right: 299, top: 719, bottom: 914 };
const CHIMNEY_CENTER_PX = 1210;
const CHIMNEY_TOP_PX = 34;

/**
 * A coherent workshop cutaway with independent animated effects and a
 * collision-aware door. The illustration itself remains a single RGBA asset;
 * no terrain, sky, island or player is baked into it.
 */
export class ModularHouse {
  readonly container = new Container();
  readonly left: number;
  readonly right: number;
  readonly groundY: number;
  readonly scale: number;

  private readonly artScale: number;
  private readonly doorSprite: Sprite;
  private readonly doorOpenFrames: Texture[];
  private readonly doorCloseFrames: Texture[];
  private readonly tracks: AnimationTrack[] = [];
  private readonly floorPlatforms: HousePlatform[];
  private readonly closedSolids: HouseSolid[];
  private readonly openSolids: HouseSolid[];
  private doorOpen = false;
  private doorTargetOpen = false;
  private destroyed = false;

  constructor(
    private readonly textures: Record<string, Texture>,
    options: HouseOptions,
  ) {
    this.scale = options.scale ?? 2;
    this.groundY = options.groundY;
    this.artScale = (DEFAULT_WIDTH * this.scale) / (2 * (ART_BOUNDS.right - ART_BOUNDS.left));
    this.left = options.x;
    this.right = options.x + (ART_BOUNDS.right - ART_BOUNDS.left) * this.artScale;
    this.container.label = 'workshop-house';
    this.container.sortableChildren = true;

    const workshop = new Sprite(this.texture(WORKSHOP_PATH));
    workshop.label = 'workshop-art';
    workshop.anchor.set(0, 0);
    workshop.scale.set(this.artScale);
    workshop.position.set(
      this.left - ART_BOUNDS.left * this.artScale,
      this.groundY - FLOOR_PX * this.artScale,
    );
    workshop.roundPixels = true;
    workshop.zIndex = 0;
    this.container.addChild(workshop);

    const door = {
      x1: this.xAt(DOOR_PX.left),
      x2: this.xAt(DOOR_PX.right),
      y1: this.yAt(DOOR_PX.top),
      y2: this.yAt(DOOR_PX.bottom),
    };
    this.doorOpenFrames = this.frames('door_open');
    this.doorCloseFrames = this.frames('door_close');
    this.doorSprite = new Sprite(this.doorCloseFrames[0] ?? Texture.WHITE);
    this.doorSprite.label = 'workshop-door';
    this.doorSprite.anchor.set(0, 1);
    // Fit the existing 32×48 animation to the empty raster opening (~61×71u).
    this.doorSprite.width = door.x2 - door.x1;
    this.doorSprite.height = door.y2 - door.y1;
    this.doorSprite.position.set(door.x1, door.y2);
    this.doorSprite.roundPixels = true;
    this.doorSprite.zIndex = 5;
    this.doorSprite.eventMode = options.onDoor ? 'static' : 'none';
    this.doorSprite.cursor = options.onDoor ? 'pointer' : 'default';
    this.doorSprite.hitArea = new Rectangle(0, -48, 32, 48);
    if (options.onDoor) this.doorSprite.on('pointertap', options.onDoor);
    this.container.addChild(this.doorSprite);
    this.tracks.push({ sprite: this.doorSprite, frames: this.doorCloseFrames, fps: 10, loop: false, elapsed: 0, phase: 0 });

    // Existing sprites provide motion for fire, chimney smoke and interior light.
    this.addAnimated('fireplace', this.xAt(425), this.yAt(914), 7, 8, true, 0.2, 0.76, true);
    this.addAnimated(
      'chimney_smoke',
      this.xAt(CHIMNEY_CENTER_PX),
      this.yAt(CHIMNEY_TOP_PX) + 3,
      2,
      7,
      true,
      0.4,
      0.72,
      true,
    );
    this.addAnimated('window_light', this.xAt(1183), this.yAt(731), 4, 3.8, true, 0.3, 0.62);

    const upperFloorY = this.yAt(UPPER_FLOOR_PX);
    this.floorPlatforms = [
      { x1: this.left, x2: this.right, y: this.groundY },
      { x1: this.left, x2: this.right, y: upperFloorY },
    ];

    // The doorway is the meaningful ground-level barrier. Side structure
    // collisions stop at the door lintel so an open entrance remains traversable.
    const doorTop = door.y1;
    const wallTop = upperFloorY - 48 * this.artScale;
    const leftWallEnd = Math.min(door.x1, this.left + 40 * this.artScale);
    const rightWallStart = this.right - 42 * this.artScale;
    const upperY = Math.min(wallTop, upperFloorY);
    // The eastern bank is eleven units above the interior floor. Leave
    // headroom above that approach as well as above the indoor threshold.
    const rightWallBottom = this.groundY - 84 * this.scale / 2;
    this.closedSolids = [
      { x1: this.left, x2: leftWallEnd, y1: upperY, y2: doorTop },
      { x1: rightWallStart, x2: this.right, y1: upperY, y2: rightWallBottom },
      door,
    ];
    this.openSolids = this.closedSolids.slice(0, 2);
  }

  get platforms(): readonly HousePlatform[] {
    return this.floorPlatforms;
  }

  get solids(): readonly HouseSolid[] {
    return this.doorOpen ? this.openSolids : this.closedSolids;
  }

  get doorBounds(): HouseSolid {
    return {
      x1: this.xAt(DOOR_PX.left),
      x2: this.xAt(DOOR_PX.right),
      y1: this.yAt(DOOR_PX.top),
      y2: this.yAt(DOOR_PX.bottom),
    };
  }

  get upperFloorY(): number {
    return this.yAt(UPPER_FLOOR_PX);
  }

  doorPosition(): { x: number; y: number } {
    const { x1, x2, y2 } = this.doorBounds;
    return { x: (x1 + x2) / 2, y: y2 };
  }

  setDoorOpen(open: boolean): void {
    if (this.destroyed || this.doorTargetOpen === open) return;
    this.doorTargetOpen = open;
    this.doorOpen = open;
    const track = this.tracks.find((item) => item.sprite === this.doorSprite);
    if (!track) return;
    track.frames = open ? this.doorOpenFrames : this.doorCloseFrames;
    track.elapsed = 0;
    track.sprite.texture = track.frames[0] ?? Texture.WHITE;
  }

  update(dt: number, reducedMotion: boolean): void {
    if (this.destroyed || dt <= 0) return;
    const delta = Math.min(dt, 0.1);
    for (const track of this.tracks) {
      if (reducedMotion) {
        if (track.sprite.label === 'workshop-smoke') {
          track.sprite.visible = false;
          continue;
        }
        const frame = track.sprite === this.doorSprite && this.doorTargetOpen
          ? track.frames.length - 1
          : 0;
        track.sprite.texture = track.frames[frame] ?? Texture.WHITE;
        continue;
      }
      track.sprite.visible = true;
      track.elapsed += delta;
      const rawFrame = Math.floor(track.elapsed * track.fps + track.phase);
      const frame = track.loop
        ? rawFrame % track.frames.length
        : Math.min(track.frames.length - 1, rawFrame);
      track.sprite.texture = track.frames[frame] ?? Texture.WHITE;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.container.destroy({ children: true, texture: false, textureSource: false });
  }

  private xAt(sourceX: number): number {
    return this.left + (sourceX - ART_BOUNDS.left) * this.artScale;
  }

  private yAt(sourceY: number): number {
    return this.groundY - (FLOOR_PX - sourceY) * this.artScale;
  }

  private texture(path: string): Texture {
    return this.textures[path] ?? Texture.WHITE;
  }

  private frames(name: AnimationName): Texture[] {
    return framePaths(name).map((path) => this.texture(path));
  }

  private addAnimated(
    name: AnimationName,
    x: number,
    y: number,
    zIndex: number,
    fps: number,
    loop: boolean,
    phase: number,
    sizeScale: number,
    bottomAnchored = false,
  ): Sprite {
    const frames = this.frames(name);
    const sprite = new Sprite(frames[0] ?? Texture.WHITE);
    sprite.label = name === 'chimney_smoke' ? 'workshop-smoke' : `workshop-${name}`;
    sprite.anchor.set(0.5, bottomAnchored ? 1 : 0.5);
    sprite.scale.set(sizeScale);
    sprite.position.set(x, y);
    sprite.roundPixels = true;
    sprite.zIndex = zIndex;
    this.container.addChild(sprite);
    this.tracks.push({ sprite, frames, fps, loop, elapsed: 0, phase });
    return sprite;
  }
}
