import { AnimatedSprite, Texture } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import type { MotionState } from './physics';

/** Physics states plus the path-only poses of the vertical journey. */
export type AnimationState = MotionState | 'climb' | 'sit';
export type AnimationTextures = Record<AnimationState, Texture[]>;

const FPS: Record<AnimationState, number> = {
  idle: 10,
  turn: 10,
  walk: 10,
  run: 12.5,
  jumpStart: 10,
  jump: 10,
  fall: 10,
  land: 10,
  climb: 9,
  sit: 8,
};

const LOOPING = new Set<AnimationState>(['idle', 'walk', 'run', 'climb']);

export class PlayerAnimator {
  readonly sprite: AnimatedSprite;
  private current: AnimationState = 'idle';
  private reducedMotion = false;
  private paused = false;

  constructor(private readonly textures: AnimationTextures) {
    this.sprite = new AnimatedSprite(textures.idle, false);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = FPS.idle / 60;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.roundPixels = true;
  }

  get state(): AnimationState {
    return this.current;
  }

  update(ticker: Ticker): void {
    if (!this.reducedMotion && !this.paused) this.sprite.update(ticker);
  }

  setReducedMotion(reduced: boolean): void {
    if (this.reducedMotion === reduced) return;
    this.reducedMotion = reduced;
    if (reduced) this.sprite.gotoAndStop(0);
    else this.sprite.gotoAndPlay(0);
  }

  /** Hold the current frame, e.g. while hanging still on the rope. */
  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setState(state: AnimationState, facing: -1 | 1): void {
    if (state !== this.current) {
      this.current = state;
      this.sprite.textures = this.textures[state];
      this.sprite.animationSpeed = FPS[state] / 60;
      this.sprite.loop = LOOPING.has(state);
      if (this.reducedMotion) this.sprite.gotoAndStop(state === 'sit' ? this.textures.sit.length - 1 : 0);
      else this.sprite.gotoAndPlay(0);
    }
    this.sprite.scale.x = facing;
  }
}
