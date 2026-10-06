import { Container, Sprite, Texture } from 'pixi.js';

/**
 * A small Terraria-style green slime: ambient, never in the way. It lives on
 * whatever floor is in view and hops toward the cursor, stopping at a polite
 * distance. Without a hovering pointer it idles and wanders a little.
 */

export interface SlimeFloor {
  x1: number;
  x2: number;
  /** Floor height at x (may follow a slope). */
  y: (x: number) => number;
}

type SlimeFrame = 'idle' | 'breathe' | 'squash' | 'stretch';

const SCALE = 2.4;
const GRAVITY = 900;

export class Slime {
  readonly sprite: Sprite;
  private readonly frames: Record<SlimeFrame, Texture>;
  private floor?: SlimeFloor;
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private airborne = false;
  private cooldown = 1;
  private squash = 0;
  private time = 0;
  private wanderTarget?: number;

  constructor() {
    this.frames = {
      idle: drawSlime(0),
      breathe: drawSlime(1),
      squash: drawSlime(2),
      stretch: drawSlime(-2),
    };
    this.sprite = new Sprite(this.frames.idle);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(SCALE);
    this.sprite.roundPixels = true;
    this.sprite.label = 'slime';
    this.sprite.alpha = 0.92;
  }

  attach(parent: Container, zIndex: number): void {
    this.sprite.zIndex = zIndex;
    parent.addChild(this.sprite);
  }

  /** Move to a new floor, landing just inside the view edge nearest the old spot. */
  setFloor(floor: SlimeFloor | undefined, view: { x: number; width: number }): void {
    if (floor === this.floor) return;
    this.floor = floor;
    this.sprite.visible = Boolean(floor);
    if (!floor) return;
    const left = Math.max(floor.x1 + 10, view.x + view.width * 0.12);
    const right = Math.min(floor.x2 - 10, view.x + view.width * 0.88);
    this.x = Math.random() < 0.5 ? left : Math.max(left, right);
    this.y = floor.y(this.x) - 90;
    this.vx = 0;
    this.vy = 0;
    this.airborne = true;
  }

  get hasFloor(): boolean {
    return Boolean(this.floor);
  }

  update(dt: number, cursorX: number | undefined, reducedMotion: boolean): void {
    const floor = this.floor;
    if (!floor) return;
    this.time += dt;
    if (reducedMotion) {
      // Still there, but calm: settle on the floor without hopping.
      this.airborne = false;
      this.y = floor.y(this.x);
      this.render('idle');
      return;
    }

    if (this.airborne) {
      this.vy += GRAVITY * dt;
      this.x = clamp(this.x + this.vx * dt, floor.x1, floor.x2);
      this.y += this.vy * dt;
      const ground = floor.y(this.x);
      if (this.y >= ground) {
        this.y = ground;
        this.airborne = false;
        this.vx = 0;
        this.squash = 0.14;
        this.cooldown = 0.35 + Math.random() * 0.6;
      }
    } else {
      this.y = floor.y(this.x);
      this.cooldown -= dt;
      const target = this.pickTarget(cursorX, floor);
      const distance = target === undefined ? 0 : target - this.x;
      if (this.cooldown <= 0 && Math.abs(distance) > 46) {
        // A short hop toward the target, like a curious Terraria slime.
        this.vx = Math.sign(distance) * Math.min(150, 60 + Math.abs(distance) * 0.5);
        this.vy = -260 - Math.random() * 90;
        this.airborne = true;
      } else if (this.cooldown <= 0) {
        this.cooldown = 0.5;
        this.wanderTarget = undefined;
      }
    }

    this.squash = Math.max(0, this.squash - dt);
    const frame: SlimeFrame = this.airborne ? (this.vy < 0 ? 'stretch' : 'idle')
      : this.squash > 0 || (this.cooldown < 0.12 && this.cooldown > 0) ? 'squash'
        : Math.sin(this.time * 3) > 0.4 ? 'breathe' : 'idle';
    this.render(frame);
  }

  private pickTarget(cursorX: number | undefined, floor: SlimeFloor): number | undefined {
    if (cursorX !== undefined) {
      // Keep a respectful distance from the pointer.
      const side = cursorX > this.x ? -1 : 1;
      return clamp(cursorX + side * 40, floor.x1, floor.x2);
    }
    if (this.wanderTarget === undefined && Math.random() < 0.004) {
      this.wanderTarget = clamp(this.x + (Math.random() - 0.5) * 300, floor.x1, floor.x2);
    }
    return this.wanderTarget;
  }

  private render(frame: SlimeFrame): void {
    this.sprite.texture = this.frames[frame];
    this.sprite.position.set(Math.round(this.x), Math.round(this.y));
  }

  destroy(): void {
    this.sprite.destroy();
    Object.values(this.frames).forEach((texture) => texture.destroy(true));
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A 16×13 pixel slime; positive `squash` flattens it, negative stretches it. */
function drawSlime(squash: number): Texture {
  const width = 16;
  const height = 13;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;
  const bodyHeight = 9 - squash;
  const bodyWidth = 12 + squash;
  const left = Math.round((width - bodyWidth) / 2);
  const top = height - bodyHeight;
  const outline = '#1f5a1c';
  const body = '#4fbf3d';
  const shade = '#3a9a2e';
  const light = '#a8ee8c';
  const pixel = (x: number, y: number, color: string) => { context.fillStyle = color; context.fillRect(x, y, 1, 1); };
  for (let y = 0; y < bodyHeight; y += 1) {
    // Dome: rows near the top are narrower.
    const inset = y === 0 ? 3 : y === 1 ? 1 : 0;
    for (let x = inset; x < bodyWidth - inset; x += 1) {
      const edge = x === inset || x === bodyWidth - inset - 1 || y === 0 || y === bodyHeight - 1;
      pixel(left + x, top + y, edge ? outline : y > bodyHeight - 3 ? shade : body);
    }
  }
  // Highlight and eyes.
  pixel(left + 3, top + 2, light);
  pixel(left + 4, top + 2, light);
  pixel(left + 3, top + 3, light);
  const eyeY = top + Math.max(3, Math.round(bodyHeight / 2));
  pixel(left + Math.round(bodyWidth * 0.38), eyeY, '#10220e');
  pixel(left + Math.round(bodyWidth * 0.62), eyeY, '#10220e');
  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}
