import { MOTION, WORLD } from './config';
import { groundYAt } from './surfaces';

export type MotionState = 'idle' | 'turn' | 'walk' | 'run' | 'jumpStart' | 'jump' | 'fall' | 'land';
export type Facing = -1 | 1;

export interface PlayerState {
  x: number;
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

export function createPlayerState(): PlayerState {
  return {
    x: WORLD.spawn.x,
    y: groundYAt(WORLD.spawn.x),
    vx: 0,
    vy: 0,
    targetX: WORLD.spawn.x,
    grounded: true,
    facing: 1,
    motion: 'idle',
    stateTime: 0,
    lastJumpZone: null,
  };
}

export function setDestination(player: PlayerState, x: number): void {
  player.targetX = Math.min(WORLD.bounds.maxX, Math.max(WORLD.bounds.minX, x));
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

function shouldAutoJump(player: PlayerState, direction: Facing): boolean {
  const zone = WORLD.jumpZones.find((candidate) => {
    const delta = candidate - player.x;
    return Math.abs(delta) < MOTION.jumpTriggerRadius && Math.sign(delta || direction) === direction;
  });
  if (zone === undefined || player.lastJumpZone === zone) return false;
  if (Math.abs(player.targetX - player.x) < 35) return false;
  player.lastJumpZone = zone;
  return true;
}

export function stepPlayer(player: PlayerState, rawDt: number): PlayerState {
  const dt = Math.min(1 / 30, Math.max(0, rawDt));
  player.stateTime += dt;
  const dx = player.targetX - player.x;
  const distance = Math.abs(dx);
  const direction = (dx < 0 ? -1 : 1) as Facing;

  if (distance > MOTION.deadZone && direction !== player.facing && player.grounded && Math.abs(player.vx) < 22) {
    player.facing = direction;
    enterState(player, 'turn');
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

  if (player.grounded && !turnLocked && Math.abs(player.vx) > 20 && shouldAutoJump(player, (player.vx < 0 ? -1 : 1) as Facing)) {
    player.grounded = false;
    player.vy = -MOTION.jumpVelocity;
    enterState(player, 'jumpStart');
  }

  const previousY = player.y;
  player.x = Math.min(WORLD.bounds.maxX, Math.max(WORLD.bounds.minX, player.x + player.vx * dt));

  if (!player.grounded) {
    player.vy += MOTION.gravity * dt;
    player.y += player.vy * dt;
    const ground = groundYAt(player.x);
    if (player.vy >= 0 && previousY <= ground && player.y >= ground) {
      player.y = ground;
      player.vy = 0;
      player.grounded = true;
      enterState(player, 'land');
    } else if (player.motion === 'jumpStart' && player.stateTime >= MOTION.jumpStartDuration) {
      enterState(player, player.vy < 0 ? 'jump' : 'fall');
    } else if (player.motion !== 'jumpStart') {
      enterState(player, player.vy < 0 ? 'jump' : 'fall');
    }
  } else {
    player.y = groundYAt(player.x);
    player.vy = 0;

    if (player.motion === 'turn' && player.stateTime < MOTION.turnDuration) return player;
    if (player.motion === 'land' && player.stateTime < MOTION.landDuration) return player;
    if (Math.abs(player.vx) < 1) enterState(player, 'idle');
    else if (Math.abs(player.vx) > MOTION.maxWalkSpeed + 12) enterState(player, 'run');
    else enterState(player, 'walk');
  }

  if (player.lastJumpZone !== null && Math.abs(player.x - player.lastJumpZone) > 70) player.lastJumpZone = null;
  return player;
}
