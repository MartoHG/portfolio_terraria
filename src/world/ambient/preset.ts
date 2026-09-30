// Centralized from prepared-assets/phase1/art-direction/animated-layers/layer-map.json.
// Coordinates remain in the approved 1774×887 source-pixel space.
export const AMBIENT_PRESET = {
  version: 'phase1.5-v1',
  canopies: [
    { id: 'green', path: '/assets/ambient/canopies/tree-green-crown.png', x: 215, y: 8, pivotX: 174, pivotY: 270, amplitude: 1.5, rotationDeg: 0.35, frequency: 0.19 },
    { id: 'pink', path: '/assets/ambient/canopies/tree-pink-crown.png', x: 1490, y: 238, pivotX: 124, pivotY: 180, amplitude: 1.25, rotationDeg: 0.45, frequency: 0.23 },
  ],
  vines: [
    { id: 'left-edge', path: '/assets/ambient/vines/vines-left-edge.png', x: 25, y: 450, amplitude: 1.5, phase: 0.15 },
    { id: 'center', path: '/assets/ambient/vines/vines-center.png', x: 315, y: 560, amplitude: 1.5, phase: 1.2 },
    { id: 'right-center', path: '/assets/ambient/vines/vines-right-center.png', x: 885, y: 540, amplitude: 1.5, phase: 2.25 },
    { id: 'bridge-right', path: '/assets/ambient/vines/vines-bridge-right.png', x: 1270, y: 500, amplitude: 1.25, phase: 3.1 },
  ],
  water: {
    surface: { path: '/assets/ambient/water/water-surface.png', mask: '/assets/ambient/masks/water-surface-mask.png', x: 1023, y: 442 },
    body: { path: '/assets/ambient/water/waterfall-body.png', mask: '/assets/ambient/masks/waterfall-body-mask.png', x: 1135, y: 503 },
    splash: { path: '/assets/ambient/water/waterfall-splash.png', mask: '/assets/ambient/masks/waterfall-splash-mask.png', x: 1132, y: 758 },
    highlights: { path: '/assets/ambient/masks/water-highlight-mask.png', x: 1023, y: 442 },
  },
  fire: {
    approvedLayer: '/assets/ambient/lights/fireplace-flame.png',
    approvedX: 728,
    approvedY: 399,
    frames: frames('/assets/ambient/runtime/fire/fireplace-flame', 5),
    x: 766,
    y: 446,
    fps: 9.0909,
    glowMask: '/assets/ambient/masks/fireplace-glow-mask.png',
    glowX: 710,
    glowY: 382,
    warmMask: '/assets/ambient/masks/warm-lights-mask.png',
    warmX: 255,
    warmY: 225,
  },
  smoke: {
    frames: frames('/assets/ambient/runtime/smoke/chimney-smoke', 6),
    emitterX: 958,
    emitterY: 80,
    fps: 7.1429,
  },
  particles: {
    green: [1, 2, 3].map((index) => `/assets/ambient/particles/leaf-green-0${index}.png`),
    pink: [1, 2].map((index) => `/assets/ambient/particles/petal-pink-0${index}.png`),
    greenEmitter: { x: 375, y: 190, spreadX: 120 },
    pinkEmitter: { x: 1615, y: 330, spreadX: 90 },
  },
  lightMasks: {
    highlightColor: 0xa9eeff,
    fireColor: 0xff8a38,
    warmColor: 0xffb34f,
  },
  budgets: {
    desktop: { smoke: 4, foliage: 12 },
    mobile: { smoke: 2, foliage: 5 },
  },
  emitEverySeconds: {
    smoke: [3.1, 4.6],
    green: [6.5, 10.5],
    pink: [8, 13],
  },
} as const;

function frames(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${folder}/frame-${String(index + 1).padStart(2, '0')}.png`);
}

export const ambientAssetPaths = [
  '/assets/ambient/base/clean-plate.png',
  ...AMBIENT_PRESET.canopies.map((item) => item.path),
  ...AMBIENT_PRESET.vines.map((item) => item.path),
  AMBIENT_PRESET.water.surface.path,
  AMBIENT_PRESET.water.surface.mask,
  AMBIENT_PRESET.water.body.path,
  AMBIENT_PRESET.water.body.mask,
  AMBIENT_PRESET.water.splash.path,
  AMBIENT_PRESET.water.splash.mask,
  AMBIENT_PRESET.water.highlights.path,
  AMBIENT_PRESET.fire.approvedLayer,
  AMBIENT_PRESET.fire.glowMask,
  AMBIENT_PRESET.fire.warmMask,
  ...AMBIENT_PRESET.fire.frames,
  ...AMBIENT_PRESET.smoke.frames,
  ...AMBIENT_PRESET.particles.green,
  ...AMBIENT_PRESET.particles.pink,
];
