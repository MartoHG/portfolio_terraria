import { pathLength, pathPoint, type PathMode, type WorldLayout } from './layout';

/**
 * The adventurer's progress along the world path. Scroll only sets a target;
 * the traveller approaches it with its own speed and acceleration, in both
 * directions, and is pulled forward only when it would leave the visible
 * safe band of the screen.
 */

export interface TravelerState {
  param: number;
  /** Signed speed along the path, units per second. */
  speed: number;
  facing: 1 | -1;
  mode: PathMode;
  x: number;
  y: number;
}

export interface SafeBand {
  /** Visible world rectangle. */
  left: number;
  top: number;
  width: number;
  height: number;
}

const SPEED: Record<PathMode, number> = { walk: 175, fall: 150, climb: 125 };
const ACCELERATION = 520;
/** Fractions of the view the traveller must stay inside. */
const BAND = { top: 0.22, bottom: 0.82, left: 0.08, right: 0.92 };

export function createTraveler(layout: Pick<WorldLayout, 'path'>, param = 0): TravelerState {
  const point = pathPoint(layout, param);
  return { param, speed: 0, facing: 1, mode: point.mode, x: point.x, y: point.y };
}

export function placeTraveler(state: TravelerState, layout: Pick<WorldLayout, 'path'>, param: number): void {
  const point = pathPoint(layout, clampParam(layout, param));
  state.param = clampParam(layout, param);
  state.speed = 0;
  state.mode = point.mode;
  state.x = point.x;
  state.y = point.y;
}

export function stepTraveler(
  state: TravelerState,
  layout: Pick<WorldLayout, 'path'>,
  target: number,
  dt: number,
  view?: SafeBand,
): TravelerState {
  if (!(dt > 0)) return state;
  const goal = clampParam(layout, target);
  const delta = goal - state.param;
  const direction = Math.sign(delta);
  const here = pathPoint(layout, state.param);
  const there = pathPoint(layout, goal);

  // Far behind on screen: hurry, but never teleport while visible.
  const lag = Math.hypot(there.x - here.x, there.y - here.y);
  const boost = 1 + Math.max(0, lag - 220) / 160;
  // Use the mode of the segment ahead in the travel direction.
  const ahead = pathPoint(layout, state.param + direction * 0.5);
  const topSpeed = SPEED[ahead.mode] * boost;
  // Brake early enough to stop on the target instead of overshooting it.
  const brakingSpeed = Math.sqrt(2 * ACCELERATION * Math.abs(delta));
  const desired = direction * Math.min(topSpeed, brakingSpeed);
  state.speed = approach(state.speed, desired, ACCELERATION * boost * dt);

  let next = state.param + state.speed * dt;
  // Never pass the goal while heading toward it.
  if ((direction > 0 && state.speed > 0 && next > goal) || (direction < 0 && state.speed < 0 && next < goal)) {
    next = goal;
    state.speed = 0;
  }
  if (Math.abs(goal - next) < 0.25) {
    next = goal;
    state.speed = 0;
  }
  if (view) next = keepInBand(layout, next, goal, view);

  const point = pathPoint(layout, next);
  if (Math.abs(point.x - state.x) > 0.01) state.facing = point.x > state.x ? 1 : -1;
  state.param = next;
  state.mode = point.mode;
  state.x = point.x;
  state.y = point.y;
  return state;
}

/** Path parameter closest to a horizontal position on the walk segment at `param`. */
export function paramAtX(layout: Pick<WorldLayout, 'path'>, param: number, x: number): number {
  const { path } = layout;
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const next = path[index];
    if (param < previous.length - 1e-6 || param > next.length + 1e-6) continue;
    if (next.mode !== 'walk' || Math.abs(next.y - previous.y) > 40) return param;
    const span = next.x - previous.x;
    if (Math.abs(span) < 1e-6) return param;
    const progress = Math.min(1, Math.max(0, (x - previous.x) / span));
    return previous.length + (next.length - previous.length) * progress;
  }
  return param;
}

function keepInBand(layout: Pick<WorldLayout, 'path'>, param: number, goal: number, view: SafeBand): number {
  const inside = (candidate: number) => {
    const point = pathPoint(layout, candidate);
    return point.y >= view.top + view.height * BAND.top - 64
      && point.y <= view.top + view.height * BAND.bottom
      && point.x >= view.left + view.width * BAND.left
      && point.x <= view.left + view.width * BAND.right;
  };
  if (inside(param) || !inside(goal)) return param;
  // Binary search toward the goal for the first visible point.
  let low = param;
  let high = goal;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (inside(middle)) high = middle;
    else low = middle;
  }
  return high;
}

function clampParam(layout: Pick<WorldLayout, 'path'>, param: number): number {
  return Math.min(pathLength(layout), Math.max(0, Number.isFinite(param) ? param : 0));
}

function approach(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  if (current > target) return Math.max(target, current - amount);
  return current;
}
