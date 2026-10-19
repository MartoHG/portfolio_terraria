import { expect, test } from '@playwright/test';

type SceneDebug = {
  ready: boolean;
  player: { x: number; y: number; targetX: number; grounded: boolean; motion: string; vx: number };
  setDestination: (x: number) => void;
  jump: () => void;
  toggleDoor: () => void;
  geometry: () => {
    doorOpen: boolean;
    door: { x1: number; x2: number; y1: number; y2: number };
    upperFloorY: number;
    house: { left: number; right: number };
    groundY: number;
  };
  toScreen: (x: number, y: number) => { x: number; y: number };
  animationFrame: () => number;
  viewport: () => { width: number; height: number };
};

type PortfolioDebug = {
  section: 'about' | 'projects' | 'skills' | 'services' | 'contact';
  worldY: number;
  entered: boolean;
  teleporting: boolean;
};

declare global {
  interface Window { __TERRARIA_DEBUG__?: SceneDebug }
  interface Window { __PORTFOLIO_DEBUG__?: PortfolioDebug }
}

async function enterWorld(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Entrar al mundo' }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.entered === true);
  // Island tests play with the content hidden.
  await page.getByRole('button', { name: 'Ver el mundo' }).click();
  await expect(page.getByRole('button', { name: 'Leer el portfolio' })).toBeVisible();
  await page.waitForFunction(() => window.__TERRARIA_DEBUG__?.ready === true);
}

test('renders modular terrain and accepts pointer movement in the new world', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/mundo/');
  await enterWorld(page);
  await expect(page.getByRole('button', { name: 'Ver el mundo' })).toHaveCount(0);
  const canvas = page.getByTestId('world-canvas');
  await expect(canvas).toBeVisible();
  expect(await page.evaluate(() => window.__TERRARIA_DEBUG__!.geometry().doorOpen)).toBe(false);

  const variant = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  await page.screenshot({
    path: `output/playwright/finalv2-${variant}.png`,
    animations: 'disabled',
    scale: 'css',
  });

  const before = await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x);
  const target = await page.evaluate(() => {
    const groundY = window.__TERRARIA_DEBUG__!.geometry().groundY;
    return window.__TERRARIA_DEBUG__!.toScreen(480, groundY);
  });
  if (variant === 'mobile') await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
  await page.waitForFunction((initialX) => Math.abs(window.__TERRARIA_DEBUG__!.player.x - initialX) > 18, before);
  expect(errors).toEqual([]);
});

test('closed door blocks the player and opening it clears the doorway collision', async ({ page }) => {
  await page.goto('/mundo/');
  await enterWorld(page);

  await page.evaluate(() => window.__TERRARIA_DEBUG__!.setDestination(800));
  await page.waitForFunction(() => window.__TERRARIA_DEBUG__!.player.x > 500);
  await page.waitForTimeout(350);
  const closed = await page.evaluate(() => ({
    x: window.__TERRARIA_DEBUG__!.player.x,
    geometry: window.__TERRARIA_DEBUG__!.geometry(),
  }));
  expect(closed.geometry.doorOpen).toBe(false);
  expect(closed.x).toBeLessThanOrEqual(closed.geometry.door.x1 - 15 + 0.5);
  expect(closed.x).toBeGreaterThan(closed.geometry.house.left);

  await page.getByRole('button', { name: 'Abrir / cerrar puerta' }).click();
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.geometry().doorOpen)).toBe(true);
  const doorRight = closed.geometry.door.x2;
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x)).toBeGreaterThan(doorRight + 60);
});

test('jumps from inside the house to its upper floor', async ({ page }, testInfo) => {
  await page.goto('/mundo/');
  await enterWorld(page);

  const interiorTarget = await page.evaluate(() => {
    const { door } = window.__TERRARIA_DEBUG__!.geometry();
    return door.x2 + 80;
  });
  await page.getByRole('button', { name: 'Abrir / cerrar puerta' }).click();
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.geometry().doorOpen)).toBe(true);
  await page.evaluate((x) => window.__TERRARIA_DEBUG__!.setDestination(x), interiorTarget);
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x)).toBeGreaterThan(interiorTarget - 12);
  await page.evaluate(() => window.__TERRARIA_DEBUG__!.jump());
  await page.waitForFunction(() => {
    const player = window.__TERRARIA_DEBUG__!.player;
    const upperFloorY = window.__TERRARIA_DEBUG__!.geometry().upperFloorY;
    return player.grounded && Math.abs(player.y - upperFloorY) < 0.1;
  });
  const state = await page.evaluate(() => ({
    ...window.__TERRARIA_DEBUG__!.player,
    upperFloorY: window.__TERRARIA_DEBUG__!.geometry().upperFloorY,
  }));
  expect(state.grounded).toBe(true);
  expect(state.y).toBe(state.upperFloorY);
  const variant = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  await page.screenshot({
    path: `output/playwright/finalv2-house-upper-${variant}.png`,
    animations: 'disabled',
    scale: 'css',
  });
});

test('crosses the bridge to the garden and returns toward the house', async ({ page }, testInfo) => {
  await page.goto('/mundo/');
  await enterWorld(page);
  await page.getByRole('button', { name: 'Abrir / cerrar puerta' }).click();
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.geometry().doorOpen)).toBe(true);
  await page.evaluate(() => window.__TERRARIA_DEBUG__!.setDestination(1600));
  await page.waitForFunction(() => {
    const player = window.__TERRARIA_DEBUG__!.player;
    return player.x > 1540 && player.grounded && Math.abs(player.y - 496) < 1;
  }, undefined, { timeout: 25_000 });

  const player = await page.evaluate(() => ({ ...window.__TERRARIA_DEBUG__!.player }));
  expect(player.x).toBeGreaterThan(1540);
  expect(player.grounded).toBe(true);
  const variant = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
  await page.screenshot({
    path: `output/playwright/finalv2-garden-player-${variant}.png`,
    animations: 'disabled',
    scale: 'css',
  });

  await page.evaluate(() => window.__TERRARIA_DEBUG__!.setDestination(1380));
  await page.waitForFunction(() => {
    const player = window.__TERRARIA_DEBUG__!.player;
    return player.x > 1350 && player.x < 1450 && player.grounded && Math.abs(player.y - 464) < 1;
  }, undefined, { timeout: 15_000 });
  await page.screenshot({
    path: `output/playwright/finalv2-bridge-player-${variant}.png`,
    animations: 'disabled',
    scale: 'css',
  });

  await page.evaluate(() => window.__TERRARIA_DEBUG__!.setDestination(800));
  await page.waitForTimeout(3_000);
  const afterReturnStart = await page.evaluate(() => ({
    ...window.__TERRARIA_DEBUG__!.player,
    doorOpen: window.__TERRARIA_DEBUG__!.geometry().doorOpen,
  }));
  expect(afterReturnStart.x, `Return should make progress from bridge: ${JSON.stringify(afterReturnStart)}`).toBeLessThan(1200);
  try {
    await page.waitForFunction(() => {
      const player = window.__TERRARIA_DEBUG__!.player;
      return player.x > 785 && player.x < 900 && player.grounded;
    }, undefined, { timeout: 8_000 });
  } catch {
    const blocked = await page.evaluate(() => ({
      ...window.__TERRARIA_DEBUG__!.player,
      doorOpen: window.__TERRARIA_DEBUG__!.geometry().doorOpen,
    }));
    throw new Error(`Return did not reach the house interior; last player state: ${JSON.stringify(blocked)}`);
  }
  expect(await page.evaluate(() => window.__TERRARIA_DEBUG__!.geometry().doorOpen)).toBe(true);
});

test('reduced motion freezes the player frames and resize preserves the scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/mundo/');
  await enterWorld(page);

  const frame = await page.evaluate(() => window.__TERRARIA_DEBUG__!.animationFrame());
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => window.__TERRARIA_DEBUG__!.animationFrame())).toBe(frame);

  const playerX = await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x);
  await page.setViewportSize({ width: 820, height: 680 });
  await expect.poll(() => page.evaluate(() => window.__TERRARIA_DEBUG__!.viewport().width)).toBe(820);
  expect(await page.evaluate(() => window.__TERRARIA_DEBUG__!.player.x)).toBeCloseTo(playerX, 4);
  await expect(page.getByTestId('world-canvas')).toBeVisible();
});
