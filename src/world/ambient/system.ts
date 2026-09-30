import {
  Container,
  MeshPlane,
  Sprite,
  Texture,
  TilingSprite,
  type Buffer,
} from 'pixi.js';
import { AMBIENT_PRESET } from './preset';
import {
  advanceParticle,
  ParticlePoolState,
  type AmbientParticle,
  type AmbientParticleKind,
} from './particles';
import { sampleWindInto, seededRandom, type WindSample } from './wind';

export interface AmbientDiagnostics {
  activeParticles: number;
  smokeParticles: number;
  foliageParticles: number;
  reducedMotion: boolean;
  paused: boolean;
  frame: number;
  visualVersion: number;
  version: string;
  wind: number;
}

interface VineMesh {
  mesh: MeshPlane;
  buffer: Buffer;
  base: Float32Array;
  amplitude: number;
  phase: number;
  verticesX: number;
  verticesY: number;
}

interface CrownMesh {
  mesh: MeshPlane;
  buffer: Buffer;
  base: Float32Array;
  amplitude: number;
  frequency: number;
  verticesX: number;
  verticesY: number;
  wind: WindSample;
}

interface VisualParticle {
  model: AmbientParticle;
  sprite: Sprite;
}

const PARTICLE_BOUNDS = { minX: -80, maxX: 1854, minY: -120, maxY: 940 } as const;

export class AmbientSystem {
  readonly container = new Container();
  readonly diagnostics: AmbientDiagnostics;
  private readonly random = seededRandom(0x1500cafe);
  private readonly wind: WindSample = { sway: 0, gust: 0 };
  private readonly crowns: CrownMesh[] = [];
  private readonly vines: VineMesh[] = [];
  private readonly particleState: ParticlePoolState;
  private readonly particles: VisualParticle[] = [];
  private readonly smokeTextures: Texture[];
  private readonly greenTextures: Texture[];
  private readonly pinkTextures: Texture[];
  private readonly budget: { smoke: number; foliage: number };
  private waterSurface?: TilingSprite;
  private waterfall?: TilingSprite;
  private waterHighlights?: TilingSprite;
  private splash?: Sprite;
  private flame?: Sprite;
  private glow?: Sprite;
  private warmLights?: Sprite;
  private elapsed = 0;
  private smokeTimer = 0.65;
  private greenTimer = 1.65;
  private pinkTimer = 2.7;
  private reducedMotion: boolean;
  private paused = false;
  private destroyed = false;

  constructor(
    private readonly textures: Record<string, Texture>,
    options: { mobile: boolean; reducedMotion: boolean },
  ) {
    this.container.sortableChildren = true;
    this.reducedMotion = options.reducedMotion;
    this.budget = options.mobile ? AMBIENT_PRESET.budgets.mobile : AMBIENT_PRESET.budgets.desktop;
    this.smokeTextures = AMBIENT_PRESET.smoke.frames.map((path) => textures[path]);
    this.greenTextures = AMBIENT_PRESET.particles.green.map((path) => textures[path]);
    this.pinkTextures = AMBIENT_PRESET.particles.pink.map((path) => textures[path]);
    this.particleState = new ParticlePoolState(this.budget.smoke + this.budget.foliage);
    this.diagnostics = {
      activeParticles: 0,
      smokeParticles: 0,
      foliageParticles: 0,
      reducedMotion: this.reducedMotion,
      paused: false,
      frame: 0,
      visualVersion: 0,
      version: AMBIENT_PRESET.version,
      wind: 0,
    };
    this.compose();
    this.createParticlePool();
    this.applyStablePose();
  }

  private compose(): void {
    const base = new Sprite(this.textures['/assets/ambient/base/clean-plate.png']);
    base.label = 'ambient-clean-plate';
    base.roundPixels = true;
    base.zIndex = 0;
    this.container.addChild(base);

    AMBIENT_PRESET.canopies.forEach((item) => {
      const mesh = new MeshPlane({ texture: this.textures[item.path], verticesX: 6, verticesY: 6 });
      mesh.label = `ambient-crown-${item.id}`;
      mesh.position.set(item.x, item.y);
      mesh.roundPixels = true;
      mesh.zIndex = 40;
      const buffer = mesh.geometry.getAttribute('aPosition').buffer;
      this.crowns.push({
        mesh,
        buffer,
        base: new Float32Array(buffer.data as Float32Array),
        amplitude: item.amplitude,
        frequency: item.frequency,
        verticesX: 6,
        verticesY: 6,
        wind: { sway: 0, gust: 0 },
      });
      this.container.addChild(mesh);
    });

    AMBIENT_PRESET.vines.forEach((item) => {
      const backfill = new Sprite(this.textures[item.path]);
      backfill.position.set(item.x, item.y);
      backfill.roundPixels = true;
      backfill.zIndex = 19;
      this.container.addChild(backfill);
      const mesh = new MeshPlane({ texture: this.textures[item.path], verticesX: 7, verticesY: 6 });
      mesh.label = `ambient-vines-${item.id}`;
      mesh.position.set(item.x, item.y);
      mesh.roundPixels = true;
      mesh.zIndex = 20;
      mesh.alpha = 0;
      const attribute = mesh.geometry.getAttribute('aPosition');
      const buffer = attribute.buffer;
      const baseVertices = new Float32Array(buffer.data as Float32Array);
      this.vines.push({ mesh, buffer, base: baseVertices, amplitude: item.amplitude, phase: item.phase, verticesX: 7, verticesY: 6 });
      this.container.addChild(mesh);
    });

    this.addStaticLayer(AMBIENT_PRESET.water.surface.path, AMBIENT_PRESET.water.surface.x, AMBIENT_PRESET.water.surface.y, 30);
    this.waterSurface = this.createMaskedTiling(AMBIENT_PRESET.water.surface, 30.5);
    this.waterSurface.alpha = 0;
    this.addStaticLayer(AMBIENT_PRESET.water.body.path, AMBIENT_PRESET.water.body.x, AMBIENT_PRESET.water.body.y, 31);
    this.waterfall = this.createMaskedTiling(AMBIENT_PRESET.water.body, 31.5);
    this.waterfall.alpha = 0;
    this.addStaticLayer(AMBIENT_PRESET.water.splash.path, AMBIENT_PRESET.water.splash.x, AMBIENT_PRESET.water.splash.y, 32);
    this.splash = this.createMaskedSprite(AMBIENT_PRESET.water.splash, 32.5);
    this.splash.alpha = 0;

    const highlights = AMBIENT_PRESET.water.highlights;
    this.waterHighlights = new TilingSprite({
      texture: this.textures[highlights.path],
      width: this.textures[highlights.path].width,
      height: this.textures[highlights.path].height,
    });
    this.waterHighlights.position.set(highlights.x, highlights.y);
    this.waterHighlights.tint = AMBIENT_PRESET.lightMasks.highlightColor;
    this.waterHighlights.blendMode = 'add';
    this.waterHighlights.alpha = 0;
    this.waterHighlights.zIndex = 33;
    this.container.addChild(this.waterHighlights);

    const approvedFlame = new Sprite(this.textures[AMBIENT_PRESET.fire.approvedLayer]);
    approvedFlame.position.set(AMBIENT_PRESET.fire.approvedX, AMBIENT_PRESET.fire.approvedY);
    approvedFlame.zIndex = 50;
    approvedFlame.roundPixels = true;
    this.container.addChild(approvedFlame);

    this.flame = new Sprite(this.textures[AMBIENT_PRESET.fire.frames[0]]);
    this.flame.anchor.set(0.5, 1);
    this.flame.position.set(AMBIENT_PRESET.fire.x, AMBIENT_PRESET.fire.y);
    this.flame.alpha = 0.38;
    this.flame.zIndex = 51;
    this.flame.roundPixels = true;
    this.container.addChild(this.flame);

    this.glow = this.createLightMask(AMBIENT_PRESET.fire.glowMask, AMBIENT_PRESET.fire.glowX, AMBIENT_PRESET.fire.glowY, AMBIENT_PRESET.lightMasks.fireColor, 49);
    this.warmLights = this.createLightMask(AMBIENT_PRESET.fire.warmMask, AMBIENT_PRESET.fire.warmX, AMBIENT_PRESET.fire.warmY, AMBIENT_PRESET.lightMasks.warmColor, 49);
  }

  private createMaskedTiling(item: { path: string; mask: string; x: number; y: number }, zIndex: number): TilingSprite {
    const texture = this.textures[item.path];
    const sprite = new TilingSprite({ texture, width: texture.width, height: texture.height });
    const mask = new Sprite(this.textures[item.mask]);
    sprite.position.set(item.x, item.y);
    mask.position.set(item.x, item.y);
    sprite.mask = mask;
    sprite.zIndex = zIndex;
    sprite.roundPixels = true;
    mask.zIndex = zIndex;
    this.container.addChild(sprite, mask);
    return sprite;
  }

  private addStaticLayer(path: string, x: number, y: number, zIndex: number): Sprite {
    const sprite = new Sprite(this.textures[path]);
    sprite.position.set(x, y);
    sprite.roundPixels = true;
    sprite.zIndex = zIndex;
    this.container.addChild(sprite);
    return sprite;
  }

  private createMaskedSprite(item: { path: string; mask: string; x: number; y: number }, zIndex: number): Sprite {
    const sprite = new Sprite(this.textures[item.path]);
    const mask = new Sprite(this.textures[item.mask]);
    sprite.position.set(item.x, item.y);
    mask.position.set(item.x, item.y);
    sprite.mask = mask;
    sprite.zIndex = zIndex;
    sprite.roundPixels = true;
    mask.zIndex = zIndex;
    this.container.addChild(sprite, mask);
    return sprite;
  }

  private createLightMask(path: string, x: number, y: number, tint: number, zIndex: number): Sprite {
    const sprite = new Sprite(this.textures[path]);
    sprite.position.set(x, y);
    sprite.tint = tint;
    sprite.blendMode = 'add';
    sprite.alpha = 0;
    sprite.zIndex = zIndex;
    this.container.addChild(sprite);
    return sprite;
  }

  private createParticlePool(): void {
    this.particleState.particles.forEach((model) => {
      const sprite = new Sprite(Texture.EMPTY);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      sprite.roundPixels = true;
      sprite.zIndex = 60;
      this.particles.push({ model, sprite });
      this.container.addChild(sprite);
    });
  }

  update(dt: number): void {
    if (this.destroyed || this.paused) return;
    this.diagnostics.frame += 1;
    if (this.reducedMotion) {
      this.applyStablePose();
      this.updateDiagnostics();
      return;
    }

    const safeDt = Math.min(1 / 20, Math.max(0, dt));
    this.elapsed += safeDt;
    sampleWindInto(this.elapsed, 0.19, this.wind);
    this.updateCanopies();
    this.updateVines();
    this.updateWater();
    this.updateLightsAndFire();
    this.updateEmitters(safeDt);
    this.updateParticles(safeDt);
    this.diagnostics.visualVersion += 1;
    this.updateDiagnostics();
  }

  private updateCanopies(): void {
    this.crowns.forEach((crown) => {
      const local = sampleWindInto(this.elapsed, crown.frequency, crown.wind);
      const data = crown.buffer.data as Float32Array;
      for (let row = 0; row < crown.verticesY; row += 1) {
        const vertical = row / (crown.verticesY - 1);
        for (let column = 0; column < crown.verticesX; column += 1) {
          const vertex = (row * crown.verticesX + column) * 2;
          const boundary = row === 0 || row === crown.verticesY - 1 || column === 0 || column === crown.verticesX - 1;
          const weight = boundary ? 0 : Math.sin(vertical * Math.PI);
          data[vertex] = crown.base[vertex] + Math.round(local.sway * crown.amplitude * weight);
          data[vertex + 1] = crown.base[vertex + 1];
        }
      }
      crown.buffer.update();
    });
  }

  private updateVines(): void {
    this.vines.forEach((vine) => {
      vine.mesh.alpha = 0.2;
      const data = vine.buffer.data as Float32Array;
      for (let row = 0; row < vine.verticesY; row += 1) {
        const vertical = row / (vine.verticesY - 1);
        for (let column = 0; column < vine.verticesX; column += 1) {
          const vertex = (row * vine.verticesX + column) * 2;
          const phase = vine.phase + column * 0.57;
          const bend = Math.sin(this.elapsed * 0.72 + phase) * vine.amplitude * vertical * vertical;
          data[vertex] = vine.base[vertex] + Math.round(bend);
          data[vertex + 1] = vine.base[vertex + 1];
        }
      }
      vine.buffer.update();
    });
  }

  private updateWater(): void {
    if (this.waterSurface) {
      this.waterSurface.tilePosition.x = -Math.floor(this.elapsed * 2.2) % Math.max(1, this.waterSurface.texture.width);
      this.waterSurface.alpha = 0.1 + (Math.sin(this.elapsed * 1.1) + 1) * 0.025;
    }
    if (this.waterfall) {
      this.waterfall.tilePosition.y = Math.floor(this.elapsed * 8) % Math.max(1, this.waterfall.texture.height);
      this.waterfall.alpha = 0.13;
    }
    if (this.waterHighlights) {
      this.waterHighlights.tilePosition.y = Math.floor(this.elapsed * 13) % Math.max(1, this.waterHighlights.texture.height);
      this.waterHighlights.alpha = 0.035 + (Math.sin(this.elapsed * 1.3) + 1) * 0.018;
    }
    if (this.splash) this.splash.alpha = 0.06 + (Math.sin(this.elapsed * 3.2) + 1) * 0.035;
  }

  private updateLightsAndFire(): void {
    if (this.flame) {
      const frame = Math.floor(this.elapsed * AMBIENT_PRESET.fire.fps) % AMBIENT_PRESET.fire.frames.length;
      const texture = this.textures[AMBIENT_PRESET.fire.frames[frame]];
      if (this.flame.texture !== texture) this.flame.texture = texture;
      this.flame.alpha = 0.32 + (Math.sin(this.elapsed * 5.1) + 1) * 0.055;
    }
    if (this.glow) this.glow.alpha = 0.018 + (Math.sin(this.elapsed * 2.17) + 1) * 0.014;
    if (this.warmLights) this.warmLights.alpha = 0.012 + (Math.sin(this.elapsed * 1.07 + 1.7) + 1) * 0.009;
  }

  private updateEmitters(dt: number): void {
    this.smokeTimer -= dt;
    this.greenTimer -= dt;
    this.pinkTimer -= dt;
    if (this.smokeTimer <= 0 && this.particleState.activeCount('smoke') < this.budget.smoke) {
      this.spawn('smoke');
      this.smokeTimer = this.randomRange(...AMBIENT_PRESET.emitEverySeconds.smoke);
    }
    if (this.greenTimer <= 0 && this.foliageCount() < this.budget.foliage) {
      this.spawn('leaf');
      this.greenTimer = this.randomRange(...AMBIENT_PRESET.emitEverySeconds.green);
    }
    if (this.pinkTimer <= 0 && this.foliageCount() < this.budget.foliage) {
      this.spawn('petal');
      if (this.foliageCount() < this.budget.foliage && this.random() > 0.55) this.spawn('petal');
      this.pinkTimer = this.randomRange(...AMBIENT_PRESET.emitEverySeconds.pink);
    }
  }

  private spawn(kind: AmbientParticleKind): void {
    const model = this.particleState.acquire();
    if (!model) return;
    model.active = true;
    model.kind = kind;
    model.age = 0;
    model.rotation = this.randomRange(-0.24, 0.24);
    model.angularVelocity = this.randomRange(-0.28, 0.28);
    model.frame = 0;
    if (kind === 'smoke') {
      model.x = AMBIENT_PRESET.smoke.emitterX + this.randomRange(-2, 2);
      model.y = AMBIENT_PRESET.smoke.emitterY;
      model.vx = this.randomRange(1.2, 3.2);
      model.vy = this.randomRange(-12, -8);
      model.lifetime = this.randomRange(3.2, 4.5);
    } else {
      const emitter = kind === 'leaf' ? AMBIENT_PRESET.particles.greenEmitter : AMBIENT_PRESET.particles.pinkEmitter;
      model.x = emitter.x + this.randomRange(-emitter.spreadX, emitter.spreadX);
      model.y = emitter.y + this.randomRange(-25, 25);
      model.vx = this.randomRange(3, 8);
      model.vy = this.randomRange(4, 9);
      model.lifetime = this.randomRange(4.5, 7.2);
    }
    const visual = this.particles.find((item) => item.model === model)!;
    const textures = kind === 'smoke' ? this.smokeTextures : kind === 'leaf' ? this.greenTextures : this.pinkTextures;
    visual.sprite.texture = textures[Math.floor(this.random() * textures.length)];
    visual.sprite.alpha = kind === 'smoke' ? 0.42 : 0.82;
    visual.sprite.scale.set(kind === 'smoke' ? this.randomRange(0.75, 1) : this.randomRange(0.65, 0.9));
    visual.sprite.visible = true;
  }

  private updateParticles(dt: number): void {
    for (const visual of this.particles) {
      const model = visual.model;
      if (!model.active) {
        visual.sprite.visible = false;
        continue;
      }
      const alive = advanceParticle(model, dt, this.wind.sway, PARTICLE_BOUNDS);
      if (!alive) {
        visual.sprite.visible = false;
        continue;
      }
      if (model.kind === 'smoke') {
        const frame = Math.min(this.smokeTextures.length - 1, Math.floor((model.age / model.lifetime) * this.smokeTextures.length));
        if (model.frame !== frame) {
          model.frame = frame;
          visual.sprite.texture = this.smokeTextures[frame];
        }
        visual.sprite.alpha = Math.max(0, 0.46 * (1 - model.age / model.lifetime));
      }
      visual.sprite.position.set(Math.round(model.x), Math.round(model.y));
      visual.sprite.rotation = model.rotation;
    }
  }

  private foliageCount(): number {
    return this.particleState.activeCount('leaf') + this.particleState.activeCount('petal');
  }

  private randomRange(min: number, max: number): number {
    return min + (max - min) * this.random();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    this.diagnostics.reducedMotion = reduced;
    if (reduced) {
      this.particleState.deactivateAll();
      this.applyStablePose();
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.diagnostics.paused = paused;
  }

  private applyStablePose(): void {
    this.crowns.forEach((crown) => {
      (crown.buffer.data as Float32Array).set(crown.base);
      crown.buffer.update();
    });
    this.vines.forEach((vine) => {
      (vine.buffer.data as Float32Array).set(vine.base);
      vine.buffer.update();
      vine.mesh.alpha = 0;
    });
    if (this.waterSurface) { this.waterSurface.tilePosition.set(0, 0); this.waterSurface.alpha = 0; }
    if (this.waterfall) { this.waterfall.tilePosition.set(0, 0); this.waterfall.alpha = 0; }
    if (this.waterHighlights) { this.waterHighlights.tilePosition.set(0, 0); this.waterHighlights.alpha = 0; }
    if (this.splash) this.splash.alpha = 0;
    if (this.flame) { this.flame.texture = this.textures[AMBIENT_PRESET.fire.frames[0]]; this.flame.alpha = 0.32; }
    if (this.glow) this.glow.alpha = 0.025;
    if (this.warmLights) this.warmLights.alpha = 0.018;
    for (const visual of this.particles) visual.sprite.visible = false;
  }

  private updateDiagnostics(): void {
    const smoke = this.particleState.activeCount('smoke');
    const foliage = this.foliageCount();
    this.diagnostics.smokeParticles = smoke;
    this.diagnostics.foliageParticles = foliage;
    this.diagnostics.activeParticles = smoke + foliage;
    this.diagnostics.wind = this.wind.sway;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.particleState.deactivateAll();
    this.updateDiagnostics();
    this.container.destroy({ children: true });
  }
}
