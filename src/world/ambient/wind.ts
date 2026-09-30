export interface WindSample {
  sway: number;
  gust: number;
}

export function sampleWind(timeSeconds: number, frequency = 0.2): WindSample {
  return sampleWindInto(timeSeconds, frequency, { sway: 0, gust: 0 });
}

export function sampleWindInto(timeSeconds: number, frequency: number, output: WindSample): WindSample {
  const slow = Math.sin(timeSeconds * Math.PI * 2 * frequency);
  const secondary = Math.sin(timeSeconds * Math.PI * 2 * frequency * 0.37);
  const gust = Math.sin(timeSeconds * Math.PI * 2 * frequency * 0.11);
  output.sway = clamp(slow * 0.7 + secondary * 0.22 + gust * 0.08, -1, 1);
  output.gust = (gust + 1) * 0.5;
  return output;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
