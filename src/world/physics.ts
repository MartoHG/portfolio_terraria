import { MOTION, WORLD } from './config';
import { groundYAt as worldGroundYAt } from './surfaces';

export type MotionState = 'idle' | 'turn' | 'walk' | 'run' | 'jumpStart' | 'jump' | 'fall' | 'land';
export type Facing = -1 | 1;

export interface PlatformSurface {
  id?: string;
  x1: number;
  x2: number;
  y: number;
}

export interface SolidRect {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface PlayerTerrain {
  minX: number;
  maxX: number;
  /** Legacy continuous floor profile. Platform terrain may omit it. */
  groundYAt?: (x: number) => number;
  /** Combine the floor profile with the explicit one-way platforms below. */
  useGroundProfile?: boolean;
  platforms?: readonly PlatformSurface[];
  /** Solid walls/obstacles; their tops are walkable only when listed as platforms. */
  solids?: readonly SolidRect[];
  playerHalfWidth?: number;
  playerHeight?: number;
  jumpZones?: readonly number[];
}

export interface PlayerBounds {
  minX: number;
  maxX: number;
}

export interface PlayerSpawn {
  x: number;
  y?: number;
}

const WORLD_TERRAIN: PlayerTerrain = {
  groundYAt: worldGroundYAt,
  minX: WORLD.bounds.minX,
  maxX: WORLD.bounds.maxX,
  jumpZones: WORLD.jumpZones,
};

const COLLISION_EPSILON = 0.001;

export interface PlayerState {
  /** Horizontal center of the collision box. */
  x: number;
  /** Bottom edge (feet) of the collision box. */
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  grounded: boolean;
  facing: Facing;
  motion: MotionState;
  stateTime: number;
  lastJumpZone: number | null;
}

export function createPlayerState(spawn: PlayerSpawn = WORLD.spawn): PlayerState {
  const x = spawn.x;
  return {
    x,
    y: spawn.y ?? worldGroundYAt(x),
    vx: 0,
    vy: 0,
    targetX: x,
    grounded: true,
    facing: 1,
    motion: 'idle',
    stateTime: 0,
    lastJumpZone: null,
  };
}

export function setDestination(player: PlayerState, x: number, bounds: PlayerBounds = WORLD.bounds): void {
  player.targetX = Math.min(bounds.maxX, Math.max(bounds.minX, x));
}

export function requestJump(player: PlayerState, velocity: number = MOTION.jumpVelocity): boolean {
  if (!player.grounded || !Number.isFinite(velocity) || velocity <= 0) return false;
  player.grounded = false;
  player.vy = -velocity;
  enterState(player, 'jumpStart');
  return true;
}

function approach(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  if (current > target) return Math.max(target, current - amount);
  return current;
}

function enterState(player: PlayerState, state: MotionState): void {
  if (player.motion !== state) {
    player.motion = state;
    player.stateTime = 0;
  }
}

function shouldAutoJump(player: PlayerState, direction: Facing, jumpZones: readonly number[]): boolean {
  const zone = jumpZones.find((candidate) => {
    const delta = candidate - player.x;
    return Math.abs(delta) < MOTION.jumpTriggerRadius && Math.sign(delta || direction) === direction;
  });
  if (zone === undefined || player.lastJumpZone === zone) return false;
  if (Math.abs(player.targetX - player.x) < 35) return false;
  player.lastJumpZone = zone;
  return true;
}

export function stepPlayer(player: PlayerState, rawDt: number, terrain: PlayerTerrain = WORLD_TERRAIN): PlayerState {
  const elapsed = Number.isFinite(rawDt) ? Math.max(0, rawDt) : 0;
  if (elapsed === 0) return player;

  // Keep acceleration and collision sweeps stable during slow frames while
  // still simulating the full elapsed time instead of dropping movement.
  const steps = Math.ceil(elapsed / (1 / 60));
  const dt = elapsed / steps;
  for (let index = 0; index < steps; index += 1) stepPlayerSlice(player, dt, terrain);
  return player;
}

function stepPlayerSlice(player: PlayerState, dt: number, terrain: PlayerTerrain): void {
  player.stateTime += dt;
  const dx = player.targetX - player.x;
  const distance = Math.abs(dx);
  const direction = (dx < 0 ? -1 : 1) as Facing;

  if (distance > MOTION.deadZone && direction !== player.facing) {
    player.facing = direction;
    if (player.grounded && Math.abs(player.vx) < 22) enterState(player, 'turn');
  }

  const turnLocked = player.motion === 'turn' && player.stateTime < MOTION.turnDuration;
  let desiredSpeed = 0;
  if (!turnLocked && distance > MOTION.deadZone) {
    const topSpeed = distance > MOTION.runDistance ? MOTION.maxRunSpeed : MOTION.maxWalkSpeed;
    const brakingFactor = Math.min(1, distance / MOTION.brakingRadius);
    desiredSpeed = direction * topSpeed * brakingFactor;
  }

  const rate = Math.abs(desiredSpeed) < Math.abs(player.vx) ? MOTION.braking : MOTION.acceleration;
  player.vx = approach(player.vx, desiredSpeed, rate * dt);

  if (distance <= MOTION.deadZone && Math.abs(player.vx) < 7) {
    player.vx = 0;
    player.x = player.targetX;
  }

  if (player.grounded && !turnLocked && Math.abs(player.vx) > 20 && shouldAutoJump(player, directionFromVelocity(player.vx), terrain.jumpZones ?? [])) {
    requestJump(player);
  }

  const previousX = player.x;
  const previousY = player.y;
  const halfWidth = terrain.playerHalfWidth ?? 18;
  const height = terrain.playerHeight ?? 48;
  const desiredX = clamp(player.x + player.vx * dt, terrain.minX, terrain.maxX);
  player.x = sweepHorizontal(previousX, desiredX, player.y, halfWidth, height, terrain.solids ?? []);

  // A walkable platform supports the player only while its top remains under
  // the feet. Leaving the last overlapping tile starts a real fall.
  if (player.grounded && !hasSupportAt(player, player.x, terrain, halfWidth)) {
    player.grounded = false;
    player.vy = 0;
  }

  if (!player.grounded) {
    player.vy += MOTION.gravity * dt;
    const desiredY = player.y + player.vy * dt;
    const collision = sweepVertical(previousX, player.x, previousY, desiredY, player.vy, halfWidth, height, terrain);
    player.y = collision.y;
    player.vy = collision.vy;
    player.grounded = collision.landed;

    if (collision.landed) enterState(player, 'land');
    else if (player.motion === 'jumpStart' && player.stateTime >= MOTION.jumpStartDuration) enterState(player, player.vy < 0 ? 'jump' : 'fall');
    else if (player.motion !== 'jumpStart') enterState(player, player.vy < 0 ? 'jump' : 'fall');
  } else {
    const supportY = supportHeightAt(player.x, player.y, terrain, halfWidth);
    if (supportY !== null) player.y = supportY;
    player.vy = 0;

    if (player.motion === 'turn' && player.stateTime < MOTION.turnDuration) return;
    if (player.motion === 'land' && player.stateTime < MOTION.landDuration) return;
    if (Math.abs(player.vx) < 1) enterState(player, 'idle');
    else if (Math.abs(player.vx) > MOTION.maxWalkSpeed + 12) enterState(player, 'run');
    else enterState(player, 'walk');
  }

  if (player.lastJumpZone !== null && Math.abs(player.x - player.lastJumpZone) > 70) player.lastJumpZone = null;
}

function directionFromVelocity(vx: number): Facing {
  return (vx < 0 ? -1 : 1) as Facing;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function horizontalOverlap(x: number, halfWidth: number, surface: Pick<PlatformSurface, 'x1' | 'x2'>): boolean {
  return x + halfWidth >= surface.x1 - COLLISION_EPSILON && x - halfWidth <= surface.x2 + COLLISION_EPSILON;
}

function supportHeightAt(x: number, y: number, terrain: PlayerTerrain, halfWidth: number): number | null {
  if (terrain.platforms?.length) {
    const platform = terrain.platforms.find((candidate) => (
      horizontalOverlap(x, halfWidth, candidate) && Math.abs(candidate.y - y) <= 1
    ));
    if (platform) return platform.y;

    if (terrain.useGroundProfile && terrain.groundYAt) {
      const groundY = terrain.groundYAt(x);
      // Follow a continuous, walkable profile only while already close to it.
      // This allows gentle hills, but never snaps an upper-floor player down
      // to the ground or catches a player who has walked off into a void.
      if (Number.isFinite(groundY) && Math.abs(groundY - y) <= 24) return groundY;
    }
    return null;
  }
  if (terrain.groundYAt) {
    const groundY = terrain.groundYAt(x);
    if (!Number.isFinite(groundY)) return null;
    if (terrain.useGroundProfile && Math.abs(groundY - y) > 24) return null;
    return groundY;
  }
  return null;
}

function hasSupportAt(player: PlayerState, x: number, terrain: PlayerTerrain, halfWidth: number): boolean {
  return supportHeightAt(x, player.y, terrain, halfWidth) !== null;
}

function overlapsRect(x: number, feetY: number, halfWidth: number, height: number, solid: SolidRect): boolean {
  const left = x - halfWidth;
  const right = x + halfWidth;
  const top = feetY - height;
  return right > solid.x1 + COLLISION_EPSILON
    && left < solid.x2 - COLLISION_EPSILON
    && feetY > solid.y1 + COLLISION_EPSILON
    && top < solid.y2 - COLLISION_EPSILON;
}

function sweepHorizontal(
  startX: number,
  endX: number,
  feetY: number,
  halfWidth: number,
  height: number,
  solids: readonly SolidRect[],
): number {
  if (startX === endX) return endX;
  let resolvedX = endX;
  for (const solid of solids) {
    if (!overlapsRect(resolvedX, feetY, halfWidth, height, solid)) continue;
    if (endX > startX && startX + halfWidth <= solid.x1 + COLLISION_EPSILON) {
      resolvedX = Math.min(resolvedX, solid.x1 - halfWidth);
    } else if (endX < startX && startX - halfWidth >= solid.x2 - COLLISION_EPSILON) {
      resolvedX = Math.max(resolvedX, solid.x2 + halfWidth);
    } else {
      resolvedX = startX;
    }
  }
  return resolvedX;
}

interface VerticalCollision {
  y: number;
  vy: number;
  landed: boolean;
}

function sweepVertical(
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  vy: number,
  halfWidth: number,
  height: number,
  terrain: PlayerTerrain,
): VerticalCollision {
  let result: VerticalCollision = { y: endY, vy, landed: false };
  if (vy >= 0) {
    const candidates: number[] = [];
    for (const platform of terrain.platforms ?? []) {
      if (startY > platform.y || endY < platform.y) continue;
      const progress = endY === startY ? 1 : (platform.y - startY) / (endY - startY);
      const crossX = startX + (endX - startX) * progress;
      if (horizontalOverlap(crossX, halfWidth, platform)) candidates.push(platform.y);
    }
    if ((!terrain.platforms?.length || terrain.useGroundProfile) && terrain.groundYAt) {
      const floor = terrain.groundYAt(endX);
      // Infinity represents a gap with no floor. Requiring a downward
      // crossing from above prevents the profile from catching a player who
      // is already below this section of ground.
      if (Number.isFinite(floor) && startY <= floor && endY >= floor) candidates.push(floor);
    }
    if (candidates.length) return { y: Math.min(...candidates), vy: 0, landed: true };
  } else {
    // Stop a jump at the underside of a solid ceiling while keeping platform
    // tops one-way: crossing a platform upward never counts as a landing.
    for (const solid of terrain.solids ?? []) {
      const startTop = startY - height;
      const endTop = endY - height;
      if (startTop < solid.y2 || endTop > solid.y2) continue;
      if (!horizontalOverlap((startX + endX) / 2, halfWidth, solid)) continue;
      return { y: solid.y2 + height, vy: 0, landed: false };
    }
  }
  return result;
}
