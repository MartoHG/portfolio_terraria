import { describe, expect, it } from 'vitest';
import { buildWorldLayout, cameraAt, pathPoint, targetParam } from './layout';
import { createTraveler, paramAtX, stepTraveler } from './traveler';

const layout = buildWorldLayout({ width: 1440, height: 900 }, { about: 600, skills: 500, services: 700, contact: 400 });

describe('traveller', () => {
  it('approaches the target with its own speed instead of jumping', () => {
    const traveler = createTraveler(layout);
    stepTraveler(traveler, layout, 400, 1 / 60);
    expect(traveler.param).toBeGreaterThan(0);
    expect(traveler.param).toBeLessThan(10);
    for (let frame = 0; frame < 600; frame += 1) stepTraveler(traveler, layout, 400, 1 / 60);
    expect(traveler.param).toBeCloseTo(400);
    expect(traveler.speed).toBe(0);
  });

  it('reverses smoothly when the target moves back', () => {
    const traveler = createTraveler(layout);
    for (let frame = 0; frame < 90; frame += 1) stepTraveler(traveler, layout, 800, 1 / 60);
    const forward = traveler.param;
    stepTraveler(traveler, layout, 0, 1 / 60);
    // Still moving forward on the first frame: it decelerates before turning.
    expect(traveler.param).toBeGreaterThan(forward);
    for (let frame = 0; frame < 900; frame += 1) stepTraveler(traveler, layout, 0, 1 / 60);
    expect(traveler.param).toBeCloseTo(0);
  });

  it('is pulled into the visible band when the scroll races ahead', () => {
    const traveler = createTraveler(layout);
    const s = layout.sections.skills;
    const camera = cameraAt(layout, s);
    const view = { left: camera.x, top: camera.y, width: layout.view.width, height: layout.view.height };
    stepTraveler(traveler, layout, targetParam(layout, s), 1 / 60, view);
    expect(traveler.y).toBeGreaterThan(view.top);
    expect(traveler.y).toBeLessThan(view.top + view.height);
  });

  it('uses the segment mode for animation', () => {
    const landing = layout.path.find((node) => node.mode === 'fall')!;
    const traveler = createTraveler(layout, landing.length - 50);
    expect(traveler.mode).toBe('fall');
    const climb = layout.path.find((node) => node.mode === 'climb')!;
    expect(pathPoint(layout, climb.length - 10).mode).toBe('climb');
  });

  it('maps a click to a position along the current floor only', () => {
    const shaft = layout.path.find((node) => node.mode === 'walk' && node.x === layout.rope.x)!;
    const onSurface = shaft.length - 500;
    const moved = paramAtX(layout, onSurface, pathPoint(layout, onSurface).x + 120);
    expect(pathPoint(layout, moved).x).toBeCloseTo(pathPoint(layout, onSurface).x + 120);
    expect(pathPoint(layout, moved).y).toBeCloseTo(layout.surfaceY);
    const climb = layout.path.find((node) => node.mode === 'climb')!;
    expect(paramAtX(layout, climb.length - 10, 0)).toBe(climb.length - 10);
  });
});
