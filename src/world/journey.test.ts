import { describe, expect, it } from 'vitest';
import {
  JOURNEY_SECTIONS,
  WORLD_HEIGHT,
  advanceTravelerPosition,
  cameraTarget,
  getScrollProgress,
  safeTravelerPosition,
  sectionForProgress,
  sectionForWorldY,
} from './journey';

describe('journey model', () => {
  it('clamps document progress and handles a page without a scroll range', () => {
    expect(getScrollProgress(-12, 100)).toBe(0);
    expect(getScrollProgress(25, 100)).toBe(0.25);
    expect(getScrollProgress(120, 100)).toBe(1);
    expect(getScrollProgress(0, 0)).toBe(0);
  });

  it('maps world positions and normalized progress to the configured zones', () => {
    for (const section of JOURNEY_SECTIONS) {
      expect(sectionForWorldY(section.worldY)).toBe(section.id);
      expect(sectionForProgress(section.worldY / WORLD_HEIGHT)).toBe(section.id);
    }
    expect(sectionForWorldY(0)).toBe('about');
    expect(sectionForWorldY(WORLD_HEIGHT + 100)).toBe('contact');
  });

  it('keeps camera targets inside the world while mapping scroll endpoints', () => {
    expect(cameraTarget(0, 800)).toBe(0);
    expect(cameraTarget(1, 800)).toBe(WORLD_HEIGHT - 800);
    expect(cameraTarget(2, 800)).toBe(WORLD_HEIGHT - 800);
    expect(cameraTarget(-1, 800)).toBe(0);
    expect(cameraTarget(1, 9000)).toBe(0);
  });

  it('holds the traveler inside the viewport safe band', () => {
    const top = safeTravelerPosition(-100, 1000, 800);
    const bottom = safeTravelerPosition(3000, 1000, 800);
    expect(top).toBe(1176);
    expect(bottom).toBe(1624);
  });

  it('moves at bounded speed and can reverse toward a changed target', () => {
    expect(advanceTravelerPosition(100, 500, 0.25, 400)).toBe(200);
    expect(advanceTravelerPosition(200, -100, 0.25, 400)).toBe(100);
    expect(advanceTravelerPosition(100, 140, 1, 400)).toBe(140);
    expect(advanceTravelerPosition(100, 500, 0, 400)).toBe(100);
  });
});
