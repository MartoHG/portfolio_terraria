import { expect, test, type Page } from '@playwright/test';

type PortfolioDebug = {
  section: 'about' | 'projects' | 'skills' | 'services' | 'contact';
  worldY: number;
  entered: boolean;
  teleporting: boolean;
};

declare global {
  interface Window { __PORTFOLIO_DEBUG__?: PortfolioDebug }
}

const sectionIds = ['about', 'projects', 'skills', 'services', 'contact'] as const;

async function enterWorld(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar al mundo' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar al mundo' }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.entered === true);
  await expect(page.getByRole('button', { name: 'Leer el portfolio' })).toBeVisible();
  await page.getByRole('button', { name: 'Leer el portfolio' }).click();
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
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marto Gavotti' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar al mundo' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación del mundo' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Entrar al mundo' }).click();
  await page.waitForFunction(() => window.__PORTFOLIO_DEBUG__?.entered === true);
  await expect(page.getByRole('button', { name: 'Leer el portfolio' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación del mundo' })).toBeVisible();
  await page.getByRole('button', { name: 'Leer el portfolio' }).click();
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
