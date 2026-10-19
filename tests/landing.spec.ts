import { expect, test } from '@playwright/test';

// The classic portfolio is the front page; the world (React + PixiJS + sprites)
// must not download until someone goes through the portal.
const isWorldRequest = (path: string) => /pixi|\/src\/main\.tsx|\/assets\/scene-v\d|\/assets\/backgrounds\//.test(path);

test('opens on the classic portfolio and loads the world only through the portal', async ({ page }) => {
  // Fonts and GSAP come from CDNs; keep the test hermetic (the page works without them).
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//, (route) => route.abort());
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Convierto procesos de papel/ })).toBeVisible();
  const portal = page.getByRole('link', { name: /Portfolio aburrido\? Entrá al mundo/ });
  await expect(portal).toBeVisible();
  await expect(portal).toHaveAttribute('href', '/mundo/');
  await page.waitForLoadState('networkidle');
  expect(requests.filter(isWorldRequest)).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(0);

  await portal.click();
  await expect(page).toHaveURL(/\/mundo\/$/);
  await expect(page.getByRole('button', { name: 'Entrar al mundo' })).toBeVisible();
  expect(requests.some(isWorldRequest)).toBe(true);

  await page.getByRole('link', { name: 'Volver al portfolio clásico' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(portal).toBeVisible();
});
