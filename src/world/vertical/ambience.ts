import { Container, Graphics, Sprite, Texture, type Renderer } from 'pixi.js';
import { propSize } from './assets';
import type { Biome, WorldLayout } from './layout';

/**
 * Slow, living ambience: torch flames with flickering light, biome particles,
 * a gentle day/night cycle and occasional rain. Durations, frequencies and
 * intensities are provisional (the brief leaves them open) and live here.
 */
export const AMBIENCE = {
  /** Full day/night cycle, in seconds. */
  dayLength: 360,
  /** Chance that a visit gets rain showers at all. */
  rainChance: 0.35,
  rainShower: [25, 55] as const,
  rainPause: [60, 140] as const,
};

export const TORCH_FRAMES = Array.from({ length: 5 }, (_, index) => `/assets/modular/animations/torch/frame-0${index + 1}.png`);

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
  age: number;
  sway: number;
  alpha: number;
}

interface Emitter {
  biome: Biome | 'island';
  x1: number; y1: number; x2: number; y2: number;
  rate: number;
  carry: number;
  texture: Texture;
  spawn: (particle: Particle, emitter: Emitter) => void;
  maxAlpha: number;
}

interface Torch { flame: Sprite; glow: Sprite; phase: number }

const random = (min: number, max: number) => min + Math.random() * (max - min);

export class Ambience {
  /** In the world container, above the scenery and below the adventurer. */
  readonly world = new Container();
  /** On the stage, above everything: rain. */
  readonly screen = new Container();
  private readonly torches: Torch[] = [];
  private readonly emitters: Emitter[] = [];
  private readonly particles: Particle[] = [];
  private readonly free: Particle[] = [];
  private readonly rain: Sprite[] = [];
  private readonly textures: Texture[] = [];
  private readonly glowTexture: Texture;
  private rainDrop?: Texture;
  private sparkle?: Texture;
  private readonly lamps: Sprite[] = [];
  private time = 0;
  private flameTime = 0;
  private dayPhase = Math.random();
  private rainy = Math.random() < AMBIENCE.rainChance;
  private rainTimer = random(10, 40);
  private raining = false;
  private rainLevel = 0;
  private pinnedTime = false;

  constructor(private readonly renderer: Renderer, private readonly frames: Texture[]) {
    this.world.label = 'ambience';
    this.world.sortableChildren = true;
    this.screen.label = 'rain';
    this.glowTexture = this.radialTexture();
    // ?time=0.5 (0 noon … 0.5 midnight) and ?rain=1 pin the ambience for reviews and tests.
    const params = new URLSearchParams(location.search);
    const time = Number.parseFloat(params.get('time') ?? '');
    if (Number.isFinite(time)) { this.dayPhase = ((time % 1) + 1) % 1; this.pinnedTime = true; }
    if (params.has('rain')) {
      this.rainy = params.get('rain') === '1';
      this.raining = this.rainy;
      this.rainLevel = this.rainy ? 1 : 0;
      this.rainTimer = Infinity;
    }
  }

  /** 1 at noon, 0 at midnight, with soft dawn and dusk. */
  get daylight(): number {
    const sun = Math.cos(this.dayPhase * Math.PI * 2);
    return Math.min(1, Math.max(0, 0.5 + sun * 0.9));
  }

  get rainIntensity(): number {
    return this.rainLevel;
  }

  build(layout: WorldLayout): void {
    for (const torch of this.torches) { torch.flame.destroy(); torch.glow.destroy(); }
    this.torches.length = 0;
    for (const lamp of this.lamps) lamp.destroy();
    this.lamps.length = 0;
    this.emitters.length = 0;
    for (const particle of this.particles) particle.sprite.destroy();
    this.particles.length = 0;
    this.free.length = 0;

    // Two torches flank every chamber; their light pools on the back wall.
    for (const chamber of layout.chambers) {
      for (const x of [chamber.x - 46, chamber.x + chamber.width + 46]) this.addTorch(x, chamber.floorY - 40, chamber.biome);
    }

    // Village lamps glow once the sun goes down.
    for (const prop of layout.props) {
      if (!prop.prop.startsWith('lamp')) continue;
      const lamp = new Sprite(this.glowTexture);
      lamp.anchor.set(0.5);
      lamp.position.set(prop.x + (prop.prop === 'lampPost' ? 0 : 14), prop.y - propSize(prop.prop).height * 0.72);
      lamp.scale.set(2.2);
      lamp.blendMode = 'add';
      lamp.tint = 0xffc86a;
      lamp.alpha = 0;
      lamp.zIndex = 0;
      this.world.addChild(lamp);
      this.lamps.push(lamp);
    }

    const pixel = (color: number, size: number) => this.pixelTexture(color, size);
    this.emitters.push(
      { biome: 'island', x1: 200, y1: 150, x2: 440, y2: 330, rate: 0.6, carry: 0, texture: pixel(0x6fae3c, 3), maxAlpha: 0.9,
        spawn: (p) => { p.vx = random(-12, 6); p.vy = random(14, 26); p.life = random(5, 8); p.sway = random(10, 22); } },
      { biome: 'island', x1: 1530, y1: 360, x2: 1620, y2: 430, rate: 0.5, carry: 0, texture: pixel(0xf2a1c6, 3), maxAlpha: 0.95,
        spawn: (p) => { p.vx = random(-10, 4); p.vy = random(10, 20); p.life = random(4, 7); p.sway = random(8, 18); } },
    );
    for (const cavern of layout.caverns) {
      const spec = this.caveEmitter(cavern.biome, pixel);
      if (spec) this.emitters.push({ biome: cavern.biome, x1: layout.bounds.x1, x2: layout.bounds.x2, y1: cavern.y1, y2: cavern.y2, carry: 0, ...spec });
    }
  }

  update(dt: number, view: { x: number; y: number; width: number; height: number }, screen: { width: number; height: number }, surfaceScreenY: number, reducedMotion: boolean): void {
    this.time += dt;
    if (!reducedMotion && !this.pinnedTime) this.dayPhase = (this.dayPhase + dt / AMBIENCE.dayLength) % 1;

    // Torch flames run at Terraria-like frame cadence; light flickers continuously.
    this.flameTime += reducedMotion ? 0 : dt;
    for (const torch of this.torches) {
      const frame = Math.floor(this.flameTime * 9 + torch.phase * 5) % this.frames.length;
      torch.flame.texture = this.frames[frame];
      const flicker = reducedMotion ? 0 : Math.sin(this.time * 7 + torch.phase * 9) * 0.06 + Math.sin(this.time * 13.3 + torch.phase) * 0.04;
      torch.glow.alpha = 0.55 + flicker;
      torch.glow.scale.set(2.6 * (1 + flicker * 0.5));
    }

    const night = 1 - this.daylight;
    for (const lamp of this.lamps) lamp.alpha = night * 0.85;

    // Particles only where the camera can see them.
    const margin = 200;
    for (const emitter of this.emitters) {
      if (reducedMotion) break;
      const visible = emitter.x2 > view.x - margin && emitter.x1 < view.x + view.width + margin
        && emitter.y2 > view.y - margin && emitter.y1 < view.y + view.height + margin;
      if (!visible) continue;
      emitter.carry += emitter.rate * dt * (emitter.biome === 'island' ? 1 : Math.min(1, view.width / 1200));
      while (emitter.carry >= 1) {
        emitter.carry -= 1;
        this.spawn(emitter, view);
      }
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.age += dt;
      const t = particle.age / particle.life;
      if (t >= 1 || reducedMotion) {
        particle.sprite.visible = false;
        this.particles.splice(index, 1);
        this.free.push(particle);
        continue;
      }
      particle.sprite.x += (particle.vx + Math.sin(particle.age * 1.7) * particle.sway) * dt;
      particle.sprite.y += particle.vy * dt;
      particle.sprite.alpha = particle.alpha * Math.min(1, t * 6, (1 - t) * 4);
    }

    this.updateRain(dt, screen, surfaceScreenY, reducedMotion);
  }

  destroy(): void {
    this.world.destroy({ children: true });
    this.screen.destroy({ children: true });
    this.textures.forEach((texture) => texture.destroy(true));
  }

  /** Magic-mirror sparkles bursting around a point (teleport departure and arrival). */
  burst(x: number, y: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    if (!this.sparkle) this.sparkle = this.pixelTexture(0xbff6ff, 3);
    for (let index = 0; index < 28; index += 1) {
      const particle = this.free.pop() ?? this.createParticle();
      const angle = (index / 28) * Math.PI * 2 + random(-0.2, 0.2);
      const speed = random(40, 120);
      particle.sprite.texture = this.sparkle;
      particle.sprite.visible = true;
      particle.sprite.zIndex = 3;
      particle.sprite.position.set(x + Math.cos(angle) * 8, y - 32 + Math.sin(angle) * 14);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - 30;
      particle.sway = 0;
      particle.age = 0;
      particle.life = random(0.5, 0.9);
      particle.alpha = 1;
      this.particles.push(particle);
    }
  }

  private caveEmitter(biome: Biome, pixel: (color: number, size: number) => Texture): Omit<Emitter, 'biome' | 'x1' | 'x2' | 'y1' | 'y2' | 'carry'> | undefined {
    switch (biome) {
      case 'upper':
        return { rate: 1.2, texture: pixel(0xb59b74, 2), maxAlpha: 0.5,
          spawn: (p) => { p.vx = random(-4, 4); p.vy = random(4, 10); p.life = random(5, 9); p.sway = random(2, 6); } };
      case 'wet':
        return { rate: 1.6, texture: pixel(0x8fd6e8, 2), maxAlpha: 0.8,
          spawn: (p) => { p.vx = 0; p.vy = random(120, 170); p.life = random(1.2, 2.2); p.sway = 0; } };
      case 'mushroom':
        return { rate: 3, texture: pixel(0x7ee4ff, 2), maxAlpha: 0.9,
          spawn: (p) => { p.vx = random(-5, 5); p.vy = random(-14, -6); p.life = random(4, 8); p.sway = random(6, 14); } };
      case 'lava':
        return { rate: 3.4, texture: pixel(0xff8a2a, 2), maxAlpha: 1,
          spawn: (p) => { p.vx = random(-8, 8); p.vy = random(-34, -18); p.life = random(2, 4); p.sway = random(4, 12); } };
      default:
        return undefined;
    }
  }

  private spawn(emitter: Emitter, view: { x: number; y: number; width: number; height: number }): void {
    const particle = this.free.pop() ?? this.createParticle();
    particle.sprite.texture = emitter.texture;
    particle.sprite.visible = true;
    // Cave emitters span the whole world width; spawn inside the view.
    const x1 = Math.max(emitter.x1, view.x - 50);
    const x2 = Math.min(emitter.x2, view.x + view.width + 50);
    particle.sprite.position.set(random(x1, x2), random(emitter.y1, emitter.y2));
    particle.age = 0;
    particle.alpha = emitter.maxAlpha;
    emitter.spawn(particle, emitter);
    this.particles.push(particle);
  }

  private createParticle(): Particle {
    const sprite = new Sprite(Texture.WHITE);
    sprite.roundPixels = true;
    sprite.zIndex = 2;
    this.world.addChild(sprite);
    return { sprite, vx: 0, vy: 0, life: 1, age: 0, sway: 0, alpha: 1 };
  }

  private addTorch(x: number, y: number, biome: Biome): void {
    const glow = new Sprite(this.glowTexture);
    glow.anchor.set(0.5);
    glow.position.set(x, y - 18);
    glow.scale.set(2.6);
    glow.blendMode = 'add';
    glow.tint = biome === 'mushroom' ? 0x7fd8ff : 0xffa64a;
    glow.zIndex = 0;
    const flame = new Sprite(this.frames[0]);
    flame.anchor.set(0.5, 1);
    flame.position.set(x, y);
    flame.scale.set(1.6);
    flame.roundPixels = true;
    flame.zIndex = 1;
    this.world.addChild(glow, flame);
    this.torches.push({ flame, glow, phase: Math.random() });
  }

  private updateRain(dt: number, screen: { width: number; height: number }, surfaceScreenY: number, reducedMotion: boolean): void {
    if (this.rainy && !reducedMotion) {
      this.rainTimer -= dt;
      if (!Number.isFinite(this.rainTimer)) this.raining = true;
      if (this.rainTimer <= 0) {
        this.raining = !this.raining;
        const [min, max] = this.raining ? AMBIENCE.rainShower : AMBIENCE.rainPause;
        this.rainTimer = random(min, max);
      }
    } else this.raining = false;
    this.rainLevel = Math.max(0, Math.min(1, this.rainLevel + (this.raining ? dt / 6 : -dt / 6)));
    const wanted = Math.round(this.rainLevel * Math.min(220, screen.width / 4.5));
    while (this.rain.length < wanted) {
      const drop = new Sprite(this.rainTexture());
      drop.position.set(random(0, screen.width), random(-screen.height, screen.height));
      drop.alpha = random(0.35, 0.65);
      this.screen.addChild(drop);
      this.rain.push(drop);
    }
    while (this.rain.length > wanted) this.rain.pop()?.destroy();
    // Rain stops at the ground line: nothing falls into the caves.
    const floor = Math.min(screen.height, surfaceScreenY);
    for (const drop of this.rain) {
      drop.x += -90 * dt;
      drop.y += 620 * dt;
      if (drop.y > floor || drop.x < -10) {
        drop.y = random(-60, -10);
        drop.x = random(0, screen.width + 120);
      }
      drop.visible = drop.y < floor;
    }
  }

  private rainTexture(): Texture {
    if (!this.rainDrop) {
      const graphics = new Graphics().rect(0, 0, 2, 9).fill({ color: 0xc8e4ff });
      this.rainDrop = this.renderer.generateTexture(graphics);
      this.textures.push(this.rainDrop);
      graphics.destroy();
    }
    return this.rainDrop;
  }

  private pixelTexture(color: number, size: number): Texture {
    const graphics = new Graphics().rect(0, 0, size, size).fill({ color });
    const texture = this.renderer.generateTexture(graphics);
    texture.source.scaleMode = 'nearest';
    graphics.destroy();
    this.textures.push(texture);
    return texture;
  }

  private radialTexture(): Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
      gradient.addColorStop(0.45, 'rgba(255,255,255,0.18)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    }
    const texture = Texture.from(canvas);
    this.textures.push(texture);
    return texture;
  }
}
