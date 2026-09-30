import { describe, expect, it } from 'vitest';
import { advanceParticle, ParticlePoolState } from './particles';

describe('ambient particle pool', () => {
  it('deactivates particles leaving strict bounds', () => {
    const pool = new ParticlePoolState(2);
    const particle = pool.acquire()!;
    Object.assign(particle, { active: true, kind: 'leaf', x: 9, y: 5, vx: 5, vy: 0, lifetime: 10 });
    expect(advanceParticle(particle, 1, 0, { minX: 0, maxX: 10, minY: 0, maxY: 10 })).toBe(false);
    expect(pool.activeCount()).toBe(0);
  });

  it('cleans every active slot without reallocating the pool', () => {
    const pool = new ParticlePoolState(4);
    for (const particle of pool.particles) particle.active = true;
    const original = pool.particles;
    pool.deactivateAll();
    expect(pool.activeCount()).toBe(0);
    expect(pool.particles).toBe(original);
    expect(pool.acquire()).toBe(pool.particles[0]);
  });
});
