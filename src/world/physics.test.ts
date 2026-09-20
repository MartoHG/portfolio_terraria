import { describe, expect, it } from 'vitest';
import { createPlayerState, setDestination, stepPlayer } from './physics';
import { groundYAt } from './surfaces';

function simulate(target: number, seconds = 8) {
  const player = createPlayerState();
  setDestination(player, target);
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) stepPlayer(player, 1 / 60);
  return player;
}

describe('destination movement', () => {
  it('arrives from either direction without oscillating', () => {
    const right = simulate(1050);
    expect(right.x).toBeCloseTo(1050, 1);
    expect(right.vx).toBe(0);
    setDestination(right, 520);
    for (let i = 0; i < 600; i += 1) stepPlayer(right, 1 / 60);
    expect(right.x).toBeCloseTo(520, 1);
    expect(right.vx).toBe(0);
    expect(right.facing).toBe(-1);
  });

  it('lands on the configured ground and never tunnels through it', () => {
    const player = createPlayerState();
    player.grounded = false;
    player.y -= 130;
    for (let i = 0; i < 240; i += 1) {
      stepPlayer(player, 1 / 60);
      expect(player.y).toBeLessThanOrEqual(groundYAt(player.x) + 0.001);
    }
    expect(player.grounded).toBe(true);
    expect(player.y).toBeCloseTo(groundYAt(player.x), 5);
  });

  it('clamps unreachable destinations to the island bounds', () => {
    const player = createPlayerState();
    setDestination(player, 99999);
    expect(player.targetX).toBe(1710);
    setDestination(player, -99999);
    expect(player.targetX).toBe(76);
  });

  it('uses the jump/fall/land sequence at the bridge seams', () => {
    const player = createPlayerState();
    setDestination(player, 1650);
    const seen = new Set<string>();
    for (let i = 0; i < 900; i += 1) {
      stepPlayer(player, 1 / 60);
      seen.add(player.motion);
    }
    expect(seen.has('jumpStart')).toBe(true);
    expect(seen.has('jump')).toBe(true);
    expect(seen.has('fall')).toBe(true);
    expect(player.grounded).toBe(true);
    expect(player.x).toBeCloseTo(1650, 1);
    expect(player.y).toBeCloseTo(groundYAt(1650), 4);
  });
});
