export type AmbientParticleKind = 'smoke' | 'leaf' | 'petal';

export interface AmbientParticle {
  active: boolean;
  kind: AmbientParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  age: number;
  lifetime: number;
  frame: number;
}

export interface ParticleBounds { minX: number; maxX: number; minY: number; maxY: number }

export function createParticle(): AmbientParticle {
  return { active: false, kind: 'leaf', x: 0, y: 0, vx: 0, vy: 0, rotation: 0, angularVelocity: 0, age: 0, lifetime: 1, frame: 0 };
}

export function advanceParticle(particle: AmbientParticle, dt: number, wind: number, bounds: ParticleBounds): boolean {
  if (!particle.active) return false;
  particle.age += dt;
  particle.vx += wind * dt * (particle.kind === 'smoke' ? 1.8 : 3.2);
  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
  particle.rotation += particle.angularVelocity * dt;
  if (particle.kind !== 'smoke') particle.vy += 2.2 * dt;
  if (
    particle.age >= particle.lifetime ||
    particle.x < bounds.minX || particle.x > bounds.maxX ||
    particle.y < bounds.minY || particle.y > bounds.maxY
  ) particle.active = false;
  return particle.active;
}

export class ParticlePoolState {
  readonly particles: AmbientParticle[];

  constructor(size: number) {
    this.particles = Array.from({ length: size }, createParticle);
  }

  acquire(): AmbientParticle | undefined {
    return this.particles.find((particle) => !particle.active);
  }

  activeCount(kind?: AmbientParticleKind): number {
    let total = 0;
    for (const particle of this.particles) if (particle.active && (!kind || particle.kind === kind)) total += 1;
    return total;
  }

  deactivateAll(): void {
    for (const particle of this.particles) particle.active = false;
  }
}
