import { AnimatedSprite, Texture } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import type { MotionState } from './physics';

export type AnimationTextures = Record<MotionState, Texture[]>;

const FPS: Record<MotionState, number> = {
  idle: 10,
  turn: 10,
  walk: 10,
  run: 12.5,
  jumpStart: 10,
  jump: 10,
  fall: 10,
  land: 10,
};

export class PlayerAnimator {
  readonly sprite: AnimatedSprite;
  private current: MotionState = 'idle';
  private reducedMotion = false;

  constructor(private readonly textures: AnimationTextures) {
    this.sprite = new AnimatedSprite(textures.idle, false);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = FPS.idle / 60;
    this.sprite.loop = true;
    this.sprite.play();
    this.sprite.roundPixels = true;
  }

  update(ticker: Ticker): void {
    if (!this.reducedMotion) this.sprite.update(ticker);
  }

  setReducedMotion(reduced: boolean): void {
    if (this.reducedMotion === reduced) return;
    this.reducedMotion = reduced;
    if (reduced) this.sprite.gotoAndStop(0);
    else this.sprite.gotoAndPlay(0);
  }

  setState(state: MotionState, facing: -1 | 1): void {
    if (state !== this.current) {
      this.current = state;
      this.sprite.textures = this.textures[state];
      this.sprite.animationSpeed = FPS[state] / 60;
      this.sprite.loop = state === 'idle' || state === 'walk' || state === 'run';
      if (this.reducedMotion) this.sprite.gotoAndStop(0);
      else this.sprite.gotoAndPlay(0);
    }
    this.sprite.scale.x = facing;
  }
}
