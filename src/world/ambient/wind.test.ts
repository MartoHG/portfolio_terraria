import { describe, expect, it } from 'vitest';
import { sampleWind, seededRandom } from './wind';

describe('ambient wind', () => {
  it('is deterministic and bounded', () => {
    for (let time = 0; time < 120; time += 0.125) {
      const first = sampleWind(time, 0.21);
      const second = sampleWind(time, 0.21);
      expect(first).toEqual(second);
      expect(first.sway).toBeGreaterThanOrEqual(-1);
      expect(first.sway).toBeLessThanOrEqual(1);
      expect(first.gust).toBeGreaterThanOrEqual(0);
      expect(first.gust).toBeLessThanOrEqual(1);
    }
  });

  it('provides a repeatable random sequence', () => {
    const a = seededRandom(151);
    const b = seededRandom(151);
    expect(Array.from({ length: 12 }, a)).toEqual(Array.from({ length: 12 }, b));
  });
});
