import { expect, test } from '@playwright/test';

type SceneDebug = {
  ready: boolean;
  player: { x: number; y: number; targetX: number; grounded: boolean; motion: string; vx: number };
  viewport: () => { width: number; height: number };
};

type PhaseDiagnostics = {
  version: string;
  frame: number;
  ambient: {
    activeParticles: number;
    smokeParticles: number;
    foliageParticles: number;
    reducedMotion: boolean;
    paused: boolean;
    frame: number;
    visualVersion: number;
    version: string;
    wind: number;
  };
};

declare global {
  interface Window { __TERRARIA_DEBUG__?: SceneDebug }
  interface Window { __phase1Diagnostics?: PhaseDiagnostics }
}

test('loads the approved island and accepts destination input', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  const canvas = page.getByTestId('world-canvas');
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => window.__TERRARIA_DEBUG__?.ready === true);
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const before = await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x);
  const isMobile = testInfo.project.name.includes('mobile');
  const destinationX = box!.x + box!.width * (isMobile ? 0.72 : 0.68);
  const destinationY = box!.y + box!.height * 0.52;
  if (isMobile) await page.touchscreen.tap(destinationX, destinationY);
  else await page.mouse.click(destinationX, destinationY);

  await page.waitForFunction(
    (initialX) => Math.abs(window.__TERRARIA_DEBUG__!.player.x - initialX) > 18,
    before,
  );
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({ ...window.__TERRARIA_DEBUG__!.player }));
  expect(Math.abs(state.x - before)).toBeGreaterThan(18);
  expect(state.targetX).not.toBe(before);
  expect(Number.isFinite(state.y)).toBe(true);

  const rightwardX = state.x;
  const leftX = box!.x + box!.width * 0.24;
  if (isMobile) await page.touchscreen.tap(leftX, destinationY);
  else await page.mouse.click(leftX, destinationY);
  await page.waitForFunction(
    (startX) => window.__TERRARIA_DEBUG__!.player.x < startX - 18,
    rightwardX,
  );
  expect(errors).toEqual([]);

  await page.screenshot({
    path: `output/playwright/phase1.5-${isMobile ? 'mobile' : 'desktop'}.png`,
    animations: 'disabled',
    scale: 'css',
  });
});

test('resizes without recreating the scene', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__TERRARIA_DEBUG__?.ready === true);
  const playerX = await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x);
  await page.setViewportSize({ width: 820, height: 680 });
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.viewport().width)).toBe(820);
  expect(await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x)).toBeCloseTo(playerX, 4);
  await expect(page.getByTestId('world-canvas')).toBeVisible();
});

test('ambient system is active, inspectable and reduced-motion safe', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const isMobile = testInfo.project.name.includes('mobile');

  await page.goto('/?debug=1');
  await page.waitForFunction(() => (window.__phase1Diagnostics?.ambient.visualVersion ?? 0) > 20);
  await page.waitForFunction(() => (window.__phase1Diagnostics?.ambient.activeParticles ?? 0) > 0);
  const active = await page.evaluate(() => structuredClone(window.__phase1Diagnostics!));
  expect(active.version).toBe('phase1.5-v1');
  expect(active.ambient.reducedMotion).toBe(false);
  expect(active.ambient.activeParticles).toBeLessThanOrEqual(isMobile ? 7 : 16);
  expect(Math.abs(active.ambient.wind)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `output/playwright/phase1.5-${isMobile ? 'mobile' : 'desktop'}-debug.png`, scale: 'css' });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForFunction(() => window.__phase1Diagnostics?.ambient.reducedMotion === true);
  const stableVersion = await page.evaluate(() => window.__phase1Diagnostics!.ambient.visualVersion);
  await page.waitForTimeout(750);
  const reduced = await page.evaluate(() => structuredClone(window.__phase1Diagnostics!.ambient));
  expect(reduced.activeParticles).toBe(0);
  expect(reduced.smokeParticles).toBe(0);
  expect(reduced.visualVersion).toBe(stableVersion);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `output/playwright/phase1.5-${isMobile ? 'mobile' : 'desktop'}-reduced.png`, scale: 'css' });
});
