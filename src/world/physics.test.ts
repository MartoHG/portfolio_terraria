import { describe, expect, it } from 'vitest';
import { createPlayerState, requestJump, setDestination, stepPlayer, type PlayerTerrain } from './physics';
import { groundYAt } from './surfaces';

function simulate(target: number, seconds = 8) {
  const player = createPlayerState();
  setDestination(player, target);
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) stepPlayer(player, 1 / 60);
  return player;
}

function simulateAtFps(target: number, seconds: number, fps: number) {
  const player = createPlayerState();
  setDestination(player, target);
  for (let frame = 0; frame < seconds * fps; frame += 1) stepPlayer(player, 1 / fps);
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

  it('turns toward a reversed destination while airborne and still arrives', () => {
    const player = createPlayerState();
    setDestination(player, 1650);
    for (let i = 0; i < 900 && (player.grounded || player.x < 1210); i += 1) stepPlayer(player, 1 / 60);

    expect(player.grounded).toBe(false);
    expect(player.x).toBeGreaterThan(1210);
    expect(['jumpStart', 'jump', 'fall']).toContain(player.motion);

    setDestination(player, 500);
    stepPlayer(player, 1 / 60);

    expect(player.facing).toBe(-1);
    expect(player.grounded).toBe(false);
    expect(['jumpStart', 'jump', 'fall']).toContain(player.motion);
    for (let i = 0; i < 900; i += 1) stepPlayer(player, 1 / 60);
    expect(player.grounded).toBe(true);
    expect(player.x).toBeCloseTo(500, 1);
    expect(player.vx).toBe(0);
    expect(player.facing).toBe(-1);
  });

  it('simulates the full elapsed time at 20 fps', () => {
    const sixty = simulateAtFps(1050, 5, 60);
    const twenty = simulateAtFps(1050, 5, 20);

    expect(twenty.x).toBeCloseTo(sixty.x, 2);
    expect(twenty.vx).toBeCloseTo(sixty.vx, 2);
    expect(twenty.motion).toBe(sixty.motion);
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

  it('accepts local ground and horizontal bounds for another scene', () => {
    const player = createPlayerState();
    const terrain: PlayerTerrain = {
      groundYAt: (x) => 300 + x * 0.02,
      minX: 500,
      maxX: 1200,
    };
    setDestination(player, 1500, terrain);
    expect(player.targetX).toBe(1200);

    for (let i = 0; i < 900; i += 1) stepPlayer(player, 1 / 60, terrain);
    expect(player.x).toBeCloseTo(1200, 1);
    expect(player.y).toBeCloseTo(324, 4);
    expect(player.grounded).toBe(true);
  });

  it('follows a smooth ground profile while walking over a hill', () => {
    const groundYAt = (x: number) => 320 + Math.sin((x - 100) / 35) * 12;
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      groundYAt,
      useGroundProfile: true,
    };
    const player = createPlayerState({ x: 100, y: groundYAt(100) });
    setDestination(player, 340, terrain);

    for (let i = 0; i < 600; i += 1) {
      stepPlayer(player, 1 / 60, terrain);
      expect(player.grounded).toBe(true);
      expect(player.y).toBeCloseTo(groundYAt(player.x), 4);
    }
  });

  it('lands on an upper platform while combining it with the ground profile', () => {
    const groundYAt = () => 464;
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      groundYAt,
      useGroundProfile: true,
      platforms: [
        { id: 'upper', x1: 100, x2: 300, y: 304 },
        { id: 'ground-edge', x1: 50, x2: 500, y: 464 },
      ],
    };
    const player = createPlayerState({ x: 200, y: 464 });
    expect(requestJump(player, 580)).toBe(true);

    for (let i = 0; i < 240 && !player.grounded; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.grounded).toBe(true);
    expect(player.y).toBe(304);
  });

  it('falls off the ground profile into a void without snapping to another surface', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      groundYAt: (x) => (x < 150 ? 304 : Number.POSITIVE_INFINITY),
      useGroundProfile: true,
      platforms: [{ id: 'ledge', x1: 50, x2: 150, y: 304 }],
    };
    const player = createPlayerState({ x: 120, y: 304 });
    setDestination(player, 260, terrain);

    for (let i = 0; i < 120; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.x).toBeGreaterThan(150);
    expect(player.y).toBeGreaterThan(304);
    expect(player.grounded).toBe(false);
  });

  it('keeps platform-only behavior when continuous ground support is disabled', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      groundYAt: () => 350,
      useGroundProfile: false,
      platforms: [{ id: 'floor', x1: 50, x2: 500, y: 400 }],
    };
    const player = createPlayerState({ x: 200, y: 350 });

    for (let i = 0; i < 120; i += 1) {
      stepPlayer(player, 1 / 60, terrain);
      if (player.grounded && player.y === 400) break;
    }

    expect(player.grounded).toBe(true);
    expect(player.y).toBe(400);
  });

  it('lands on the lowest crossed platform with feet on its top edge', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      platforms: [
        { id: 'upper', x1: 100, x2: 280, y: 304 },
        { id: 'lower', x1: 100, x2: 450, y: 460 },
      ],
    };
    const player = createPlayerState({ x: 400, y: 180 });
    player.grounded = false;

    for (let i = 0; i < 240 && !player.grounded; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.grounded).toBe(true);
    expect(player.y).toBe(460);
    expect(player.motion).toBe('land');
  });

  it('jumps through a platform underside and lands on the upper platform from above', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      platforms: [
        { id: 'lower', x1: 100, x2: 420, y: 460 },
        { id: 'upper', x1: 100, x2: 300, y: 304 },
      ],
    };
    const player = createPlayerState({ x: 200, y: 460 });
    expect(requestJump(player, 580)).toBe(true);
    let reachedAbovePlatform = false;
    for (let i = 0; i < 240 && !player.grounded; i += 1) {
      stepPlayer(player, 1 / 60, terrain);
      if (player.y < 304) reachedAbovePlatform = true;
    }

    expect(reachedAbovePlatform).toBe(true);
    expect(player.grounded).toBe(true);
    expect(player.y).toBe(304);
    expect(requestJump(player, 580)).toBe(true);
    player.grounded = false;
    expect(requestJump(player, 580)).toBe(false);
  });

  it('falls from an upper platform and lands on a lower platform after walking off', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      platforms: [
        { id: 'ledge', x1: 100, x2: 150, y: 304 },
        { id: 'floor', x1: 150, x2: 400, y: 460 },
      ],
    };
    const player = createPlayerState({ x: 120, y: 304 });
    setDestination(player, 260, terrain);

    for (let i = 0; i < 600; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.x).toBeCloseTo(260, 1);
    expect(player.grounded).toBe(true);
    expect(player.y).toBe(460);
  });

  it('blocks walking through house walls using the player collision box', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      playerHalfWidth: 18,
      playerHeight: 48,
      platforms: [{ id: 'floor', x1: 80, x2: 400, y: 460 }],
      solids: [{ x1: 190, x2: 230, y1: 300, y2: 460 }],
    };
    const player = createPlayerState({ x: 150, y: 460 });
    setDestination(player, 300, terrain);

    for (let i = 0; i < 240; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.x).toBeCloseTo(172, 1);
    expect(player.grounded).toBe(true);
  });

  it('stops a jump at the underside of a solid roof', () => {
    const terrain: PlayerTerrain = {
      minX: 50,
      maxX: 500,
      playerHalfWidth: 18,
      playerHeight: 48,
      platforms: [{ id: 'house-floor', x1: 100, x2: 300, y: 400 }],
      solids: [{ x1: 120, x2: 280, y1: 300, y2: 352 }],
    };
    const player = createPlayerState({ x: 200, y: 400 });
    expect(requestJump(player, 580)).toBe(true);

    for (let i = 0; i < 60; i += 1) stepPlayer(player, 1 / 60, terrain);

    expect(player.grounded).toBe(true);
    expect(player.y).toBe(400);
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
