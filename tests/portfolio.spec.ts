import { expect, test, type Page } from '@playwright/test';

type PortfolioDebug = {
  section: 'about' | 'projects' | 'skills' | 'services' | 'contact';
  scroll: number;
  worldY: number;
  entered: boolean;
  teleporting: boolean;
};

declare global {
  interface Window { __PORTFOLIO_DEBUG__?: PortfolioDebug }
}

const sectionIds = ['about', 'projects', 'skills', 'services', 'contact'] as const;

async function enterWorld(page: Page) {
  await page.goto('/mundo/');
  await expect(page.getByRole('button', { name: 'Entrar al mundo' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar al mundo' }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.entered === true);
  await expect(page.getByRole('button', { name: 'Ver el mundo' })).toBeVisible();
  await expect(page.locator('[data-section="about"]')).toHaveAttribute('aria-current', 'location');
}

async function navigateTo(page: Page, id: (typeof sectionIds)[number], label: string) {
  const button = page.getByRole('button', { name: `Ir a ${label}` });
  await button.click();
  await expect(button).toHaveAttribute('aria-current', 'location');
  await expect(page.locator(`[data-section="${id}"]`)).toHaveAttribute('aria-current', 'location');
  await page.waitForFunction((section) => (
    window.__PORTFOLIO_DEBUG__?.section === section && !window.__PORTFOLIO_DEBUG__?.teleporting
  ), id);
}

test('starts at the menu and navigates between zones with a return to the sky', async ({ page }) => {
  await page.goto('/mundo/');
  await expect(page.getByRole('heading', { name: 'Marto Gavotti' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar al mundo' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación del mundo' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Entrar al mundo' }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.entered === true);
  await expect(page.getByRole('navigation', { name: 'Navegación del mundo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver el mundo' })).toBeVisible();
  await expect(page.locator('[data-section="about"]')).toHaveAttribute('aria-current', 'location');

  await navigateTo(page, 'projects', 'Proyectos');
  await navigateTo(page, 'contact', 'Contacto');
  await page.getByRole('navigation', { name: 'Navegación del mundo' }).getByRole('button', { name: 'Volver al cielo' }).click();
  await expect(page.locator('[data-section="about"]')).toHaveAttribute('aria-current', 'location');
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.section === 'about' && !window.__PORTFOLIO_DEBUG__.teleporting);
});

test('opens an accessible project dialog, closes with Escape and restores focus', async ({ page }) => {
  await enterWorld(page);
  await navigateTo(page, 'projects', 'Proyectos');

  const openButton = page.getByRole('button', { name: 'Abrir detalles de Senda' });
  await openButton.click();
  const dialog = page.getByRole('dialog', { name: 'Senda' });
  await expect(dialog).toBeVisible();
  const closeButton = page.getByRole('button', { name: 'Cerrar detalles del proyecto' });
  await expect(closeButton).toBeFocused();

  const gallery = dialog.getByRole('group', { name: 'Galería de Senda' });
  await expect(gallery.getByRole('img', { name: 'Pantalla de inicio de sesión de Senda' })).toBeVisible();
  await expect(gallery.getByText('1 de 20')).toBeVisible();
  await gallery.getByRole('button', { name: 'Ver captura siguiente' }).click();
  await expect(gallery.getByText('2 de 20')).toBeVisible();
  await expect(gallery.getByRole('img', { name: 'Panel principal con accesos a estudiantes, resoluciones, cursos y personal' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(openButton).toBeFocused();
});

test('exposes the real email, LinkedIn and GitHub contact links', async ({ page }) => {
  await enterWorld(page);
  await navigateTo(page, 'contact', 'Contacto');

  const contact = page.locator('[data-section="contact"]');
  await expect(contact.getByRole('link', { name: 'marticontacto21@gmail.com' })).toHaveAttribute('href', 'mailto:marticontacto21@gmail.com');
  await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/martiniano-gavotti-538bba18b');
  await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/MartoHG');
});

test('scroll drives the vertical journey on desktop and mobile', async ({ page }, testInfo) => {
  await enterWorld(page);
  const scrollable = await page.evaluate(() => document.scrollingElement !== null);
  expect(scrollable).toBe(true);
  const viewportHeight = page.viewportSize()!.height;
  const navigationBox = await page.getByRole('navigation', { name: 'Navegación del mundo' }).boundingBox();
  expect(navigationBox).not.toBeNull();
  if (testInfo.project.name.includes('mobile')) expect(navigationBox!.y).toBeGreaterThan(viewportHeight / 2);
  else expect(navigationBox!.y).toBeLessThan(viewportHeight / 2);

  const initial = await page.evaluate(() => ({
    scrollTop: document.scrollingElement?.scrollTop ?? 0,
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    clientHeight: document.scrollingElement?.clientHeight ?? 0,
    worldY: window.__PORTFOLIO_DEBUG__?.worldY,
  }));
  expect(initial.scrollHeight).toBeGreaterThan(initial.clientHeight + 300);

  await page.evaluate(() => {
    const scroller = document.scrollingElement;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
  });
  await expect.poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBeGreaterThan(initial.scrollTop);
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.section === 'contact');
  const bottomY = await page.evaluate(() => window.__PORTFOLIO_DEBUG__?.worldY ?? 0);
  expect(bottomY).toBeGreaterThan(initial.worldY ?? 0);

  await page.evaluate(() => document.scrollingElement?.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.section === 'about');
  await expect(page.locator('[data-section="about"]')).toHaveAttribute('aria-current', 'location');

});

type TravelerDebug = { mode: 'physics' | 'path'; segment: string; x: number; y: number; animation: string; visible: boolean };
type SceneCamera = { x: number; y: number; scale: number };

async function traveler(page: Page) {
  return page.evaluate(() => (window as unknown as { __TERRARIA_DEBUG__: { traveler: () => TravelerDebug } }).__TERRARIA_DEBUG__.traveler());
}

async function camera(page: Page) {
  return page.evaluate(() => (window as unknown as { __TERRARIA_DEBUG__: { camera: () => SceneCamera } }).__TERRARIA_DEBUG__.camera());
}

test('descends from the island through the village into the caves', async ({ page }) => {
  await enterWorld(page);
  await page.waitForFunction(() => (window as unknown as { __TERRARIA_DEBUG__?: { ready: boolean } }).__TERRARIA_DEBUG__?.ready === true);
  expect((await traveler(page)).mode).toBe('physics');

  // Into the village: the camera pans sideways while the scroll keeps going down.
  await navigateTo(page, 'projects', 'Proyectos');
  const panStart = await camera(page);
  await expect.poll(async () => (await traveler(page)).mode).toBe('path');
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'instant' }));
  await expect.poll(async () => (await camera(page)).x).toBeGreaterThan(panStart.x + 200);
  expect((await camera(page)).y).toBeCloseTo(panStart.y, 0);
  await expect(page.getByRole('button', { name: 'Abrir detalles de Plataforma de labor legislativa' })).toBeInViewport();

  // Down the shaft: the adventurer climbs the rope and stays on screen.
  await navigateTo(page, 'skills', 'Skills');
  await expect(page.locator('[data-section="skills"]')).toBeInViewport();
  await expect.poll(async () => (await traveler(page)).segment, { timeout: 15_000 }).toBe('walk');
  const view = page.viewportSize()!;
  const state = await traveler(page);
  const cam = await camera(page);
  const screenY = (state.y - cam.y) * cam.scale;
  expect(state.visible).toBe(true);
  expect(screenY).toBeGreaterThan(0);
  expect(screenY).toBeLessThan(view.height);

  // The magic mirror brings everyone back to the island, where physics resume.
  await navigateTo(page, 'contact', 'Contacto');
  await page.locator('[data-section="contact"]').getByRole('button', { name: /Volver al cielo/ }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.section === 'about' && !window.__PORTFOLIO_DEBUG__.teleporting);
  await expect.poll(async () => (await traveler(page)).mode, { timeout: 15_000 }).toBe('physics');
});

test('the adventurer sits on a hovered card and visits the building of an opened project', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Hover needs a mouse.');
  await enterWorld(page);
  await page.waitForFunction(() => (window as unknown as { __TERRARIA_DEBUG__?: { ready: boolean } }).__TERRARIA_DEBUG__?.ready === true);
  await navigateTo(page, 'projects', 'Proyectos');
  const card = page.locator('.project-card').first();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + box.height - 20);
  await page.mouse.move(box.x + 40, box.y + box.height - 30, { steps: 4 });
  await expect.poll(async () => (await traveler(page)).animation).toBe('sit');

  await card.getByRole('button', { name: 'Abrir detalles de Senda' }).click();
  await expect(page.getByRole('dialog', { name: 'Senda' })).toBeVisible();
  // While the panel is open the adventurer is inside the building.
  await expect.poll(async () => (await traveler(page)).visible).toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Senda' })).toBeHidden();
  await expect.poll(async () => (await traveler(page)).visible).toBe(true);
});
