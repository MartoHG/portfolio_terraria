import { Container, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';

const MODULAR_ROOT = '/assets/modular';
const VEG_ROOT = `${MODULAR_ROOT}/vegetation`;
const WATER_ROOT = `${MODULAR_ROOT}/water`;

const framePaths = (name: string, count: number) => Array.from(
  { length: count },
  (_, index) => `${WATER_ROOT}/${name}/frame-${String(index + 1).padStart(2, '0')}.png`,
);

const vegetationPaths = {
  trunk: `${VEG_ROOT}/trunk.png`,
  crown01: `${VEG_ROOT}/crown-01.png`,
  crown02: `${VEG_ROOT}/crown-02.png`,
  grass: `${VEG_ROOT}/grass.png`,
  flower: `${VEG_ROOT}/flower.png`,
  rock: `${VEG_ROOT}/rock.png`,
  liana: `${VEG_ROOT}/liana.png`,
  roots: `${VEG_ROOT}/roots.png`,
} as const;

export const NATURE_WATER_FRAMES = {
  surface: framePaths('water_surface', 6),
  body: framePaths('water_body', 5),
  waterfallStart: framePaths('waterfall_start', 5),
  waterfallLoop: framePaths('waterfall_loop', 5),
  waterfallEnd: framePaths('waterfall_end', 5),
  splash: framePaths('water_splash', 5),
} as const;

export const NATURE_ASSET_PATHS: string[] = [
  '/assets/scene-v2/tree-green-v2.png',
  '/assets/ambient/canopies/tree-pink-crown.png',
  '/assets/ambient/water/water-surface.png',
  '/assets/ambient/water/waterfall-body.png',
  '/assets/ambient/particles/leaf-green-01.png',
  '/assets/ambient/particles/petal-pink-01.png',
  ...Object.values(vegetationPaths),
  ...Object.values(NATURE_WATER_FRAMES).flat(),
];

interface NatureSprite {
  sprite: Sprite;
  baseX: number;
  phase: number;
  amplitude: number;
  frequency: number;
}

interface AnimatedTextureSprite {
  sprite: Sprite | TilingSprite;
  frames: readonly string[];
  frameSeconds: number;
  elapsed: number;
  frameIndex: number;
}

const tintVariants = [0xffffff, 0xf4ffe9, 0xeaf4d7, 0xfff5df] as const;

export class ModularNature {
  readonly container = new Container();
  private readonly crowns: NatureSprite[] = [];
  private readonly waterAnimations: AnimatedTextureSprite[] = [];
  private elapsed = 0;
  private readonly groundAt?: (x:number)=>number;
  private readonly derivedTextures: Texture[] = [];
  private reducedMotion: boolean;
  private destroyed = false;

  constructor(
    private readonly textures: Record<string, Texture>,
    options: { reducedMotion?: boolean; groundYAt?: (x:number)=>number } = {},
  ) {
    this.reducedMotion = Boolean(options.reducedMotion);
    this.groundAt = options.groundYAt;
    this.container.sortableChildren = true;
    this.createTrees();
    this.createGroundCover();

    this.createWater();
  }

  update(dt: number, reducedMotion = this.reducedMotion): void {
    if (this.destroyed) return;
    if (reducedMotion) {
      if (!this.reducedMotion) this.resetAnimationFrames();
      this.crowns.forEach(({ sprite, baseX }) => { sprite.x = baseX; });
      this.reducedMotion = true;
      return;
    }
    this.reducedMotion = false;

    const step = Math.min(0.1, Math.max(0, dt));
    this.elapsed += step;
    for (const crown of this.crowns) {
      crown.sprite.x = crown.baseX + Math.sin(this.elapsed * crown.frequency + crown.phase) * crown.amplitude;
    }
    for (const animation of this.waterAnimations) this.advanceFrame(animation, step);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.container.destroy({ children: true });
    this.derivedTextures.forEach((texture) => texture.destroy(false));
    this.crowns.length = 0;
    this.waterAnimations.length = 0;
  }

  private texture(path: string): Texture {
    const texture = this.textures[path];
    if (!texture) throw new Error(`Missing modular nature texture: ${path}`);
    texture.source.scaleMode = 'nearest';
    return texture;
  }

  private addSprite(path: string, x: number, y: number, scale: number, options: {
    anchorX?: number;
    anchorY?: number;
    tint?: number;
    zIndex?: number;
    label?: string;
  } = {}): Sprite {
    const sprite = new Sprite(this.texture(path));
    sprite.anchor.set(options.anchorX ?? 0, options.anchorY ?? 0);
    sprite.position.set(x, y);
    sprite.scale.set(scale);
    sprite.tint = options.tint ?? 0xffffff;
    sprite.zIndex = options.zIndex ?? 10;
    sprite.roundPixels = true;
    if (options.label) sprite.label = options.label;
    this.container.addChild(sprite);
    return sprite;
  }

  private createTrees(): void {
    const source = this.texture('/assets/scene-v2/tree-green-v2.png').source;
    // A tree is split at an overlapping branch band, retaining its root anchor.
    const crownTexture = new Texture({source, frame: new Rectangle(41, 18, 1175, 924)});
    const trunkTexture = new Texture({source, frame: new Rectangle(41, 910, 1175, 330)});
    this.derivedTextures.push(crownTexture, trunkTexture);
    const scale = .285;
    const left = 318 - 1175 * scale / 2;
    const top = 430 - 1222 * scale;
    const trunk = new Sprite(trunkTexture);
    trunk.scale.set(scale); trunk.position.set(left, top + (910 - 18) * scale); trunk.zIndex = 18;
    this.container.addChild(trunk);
    const crown = new Sprite(crownTexture);
    crown.scale.set(scale); crown.position.set(left, top); crown.zIndex = 20;
    this.container.addChild(crown);
    this.crowns.push({sprite: crown, baseX: left, phase: .2, amplitude: .7, frequency: .32});

    const pinkTrunk = new Sprite(trunkTexture);
    pinkTrunk.scale.set(.24); pinkTrunk.position.set(1574 - 1175 * .24 / 2, 496 - 330 * .24);
    pinkTrunk.zIndex = 18; this.container.addChild(pinkTrunk);
    const pinkSource = this.texture('/assets/ambient/canopies/tree-pink-crown.png').source;
    const pinkTexture = new Texture({source: pinkSource, frame: new Rectangle(16, 35, 203, 145)});
    this.derivedTextures.push(pinkTexture);
    const pink = new Sprite(pinkTexture); pink.anchor.set(.5,1); pink.scale.set(1.08);
    pink.position.set(1574, 496 - 330 * .24 + 26); pink.zIndex = 20; this.container.addChild(pink);
    this.crowns.push({sprite: pink, baseX: pink.x, phase: 1.7, amplitude: .65, frequency: .27});
  }

  private surfaceY(x:number,fallback:number):number {
    const y=this.groundAt?.(x);
    return y !== undefined && Number.isFinite(y) ? y : fallback;
  }

  private createGroundCover(): void {
    const grassPositions: Array<[number, number, number]> = [
      [164, 432, 1.2], [248, 432, 0.95], [365, 464, 1.2], [480, 464, 1.05],
      [1048, 464, 1.15], [1070, 464, .85], [1100, 464, .95],
      [1208, 480, 1.15], [1496, 496, 1], [1584, 496, 1.2], [1660, 496, 0.95],
    ];
    grassPositions.forEach(([x, y, scale], index) => {
      this.addSprite(vegetationPaths.grass, x, this.surfaceY(x,y), scale, {
        anchorX: 0.5,
        anchorY: 1,
        tint: tintVariants[index % tintVariants.length],
        zIndex: 36,
        label: 'modular-grass-clump',
      });
    });

    const flowers: Array<[number, number, number]> = [
      [208, 432, 1], [410, 464, 1.2], [1050, 464, .95], [1076, 464, 1.1], [1150, 464, 0.95], [1530, 496, 1.2],
      [1636, 496, 1],
    ];
    flowers.forEach(([x, y, scale], index) => {
      this.addSprite(vegetationPaths.flower, x, this.surfaceY(x,y), scale, {
        anchorX: 0.5,
        anchorY: 1,
        tint: tintVariants[(index + 1) % tintVariants.length],
        zIndex: 38,
        label: 'modular-flower',
      });
    });

    const rocks: Array<[number, number, number]> = [
      [332, 464, 1.8], [450, 464, .85], [1120, 464, 1.4],
      [1512, 496, 1.5], [1658, 496, 1.8],
    ];
    rocks.forEach(([x, y, scale]) => this.addSprite(vegetationPaths.rock, x, this.surfaceY(x,y), scale, {
      anchorX: 0.5,
      anchorY: 1,
      tint: 0xf7efdc,
      zIndex: 34,
      label: 'modular-rock',
    }));
  }

  private createWater(): void {
    const river = this.addSprite('/assets/ambient/water/water-surface.png', 1110, 461, 1, {zIndex: 12, label: 'river-bank'});
    river.width = 174; river.height = 52;
    const fall = this.addSprite('/assets/ambient/water/waterfall-body.png', 1240, 497, 1, {zIndex: 10, label: 'waterfall-skin'});
    fall.width = 74; fall.height = 315;
    const surface = this.addAnimatedTiling(NATURE_WATER_FRAMES.surface, .1, 1119, 477, 145, 9, .65, 'modular-water-surface', 13);
    surface.alpha = .6;
    const stream = this.addAnimatedTiling(NATURE_WATER_FRAMES.waterfallLoop, .09, 1251, 506, 31, 284, .55, 'modular-waterfall', 11);
    stream.alpha = .32;
    const splash = this.addAnimatedSprite(NATURE_WATER_FRAMES.splash, .1, 1265, 812, .9, 14, 'modular-waterfall-splash', .5, 1);
    splash.alpha = .65;
  }

  private addAnimatedSprite(paths: readonly string[], frameSeconds: number, x: number, y: number, scale: number, zIndex: number, label: string, anchorX = 0, anchorY = 0): Sprite {
    const sprite = this.addSprite(paths[0], x, y, scale, { anchorX, anchorY, zIndex, label });
    this.waterAnimations.push({ sprite, frames: paths, frameSeconds, elapsed: 0, frameIndex: 0 });
    return sprite;
  }

  private addAnimatedTiling(paths: readonly string[], frameSeconds: number, x: number, y: number, width: number, height: number, tileScale: number, label: string, zIndex: number): TilingSprite {
    const sprite = new TilingSprite({ texture: this.texture(paths[0]), width, height });
    sprite.position.set(x, y);
    sprite.tileScale.set(tileScale);
    sprite.roundPixels = true;
    sprite.zIndex = zIndex;
    sprite.label = label;
    this.container.addChild(sprite);
    this.waterAnimations.push({ sprite, frames: paths, frameSeconds, elapsed: 0, frameIndex: 0 });
    return sprite;
  }

  private advanceFrame(animation: AnimatedTextureSprite, dt: number): void {
    animation.elapsed += dt;
    while (animation.elapsed >= animation.frameSeconds) {
      animation.elapsed -= animation.frameSeconds;
      animation.frameIndex = (animation.frameIndex + 1) % animation.frames.length;
      animation.sprite.texture = this.texture(animation.frames[animation.frameIndex]);
    }
  }

  private resetAnimationFrames(): void {
    for (const animation of this.waterAnimations) {
      animation.frameIndex = 0;
      animation.elapsed = 0;
      animation.sprite.texture = this.texture(animation.frames[0]);
    }
  }
}
