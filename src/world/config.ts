export type SurfaceId = 'main' | 'bridge' | 'islet';

export interface Surface {
  id: SurfaceId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const WORLD = {
  width: 1774,
  height: 887,
  spawn: { x: 690, y: 466 },
  bounds: { minX: 76, maxX: 1710 },
  surfaces: [
    { id: 'main', x1: 76, y1: 400, x2: 235, y2: 400 },
    { id: 'main', x1: 235, y1: 400, x2: 430, y2: 460 },
    { id: 'main', x1: 430, y1: 460, x2: 1030, y2: 460 },
    { id: 'main', x1: 1030, y1: 460, x2: 1244, y2: 489 },
    { id: 'bridge', x1: 1244, y1: 489, x2: 1476, y2: 489 },
    { id: 'islet', x1: 1476, y1: 489, x2: 1710, y2: 475 },
  ] satisfies Surface[],
  jumpZones: [1240, 1478],
} as const;

export const MOTION = {
  acceleration: 430,
  braking: 690,
  maxWalkSpeed: 92,
  maxRunSpeed: 174,
  runDistance: 260,
  brakingRadius: 88,
  deadZone: 3.25,
  gravity: 860,
  jumpVelocity: 295,
  jumpTriggerRadius: 17,
  turnDuration: 0.22,
  landDuration: 0.28,
  jumpStartDuration: 0.14,
} as const;

export const ASSETS = {
  island: '/assets/art/phase1-floating-island-workshop-v1.png',
  sky: '/assets/backgrounds/sky-base.png',
  mountainsFar: '/assets/backgrounds/mountains-far.png',
  mountainsMid: '/assets/backgrounds/mountains-mid.png',
  forest: '/assets/backgrounds/forest-horizon.png',
  clouds: [
    '/assets/backgrounds/cloud-01.png',
    '/assets/backgrounds/cloud-02.png',
    '/assets/backgrounds/cloud-03.png',
  ],
  touchTarget: '/assets/controls/touch-target.png',
  adventurer: {
    idle: frames('adventurer_idle', 6),
    turn: frames('adventurer_turn', 4),
    walk: frames('adventurer_walk', 8),
    run: frames('adventurer_run', 8),
    jumpStart: frames('adventurer_jump_start', 3),
    jump: frames('adventurer_jump_up', 4),
    fall: frames('adventurer_fall', 4),
    land: frames('adventurer_land', 4),
  },
} as const;

function frames(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    `/assets/adventurer/${folder}/frame-${String(index + 1).padStart(2, '0')}.png`,
  );
}
