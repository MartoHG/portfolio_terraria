import { describe, expect, it } from 'vitest';
import { activeSection, buildWorldLayout, cameraAt, ISLAND, pathLength, pathPoint, targetParam } from './layout';

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const heights = { about: 640, skills: 520, services: 760, contact: 420 };

describe('vertical world layout', () => {
  it('starts on the island and ends at the deep refuge', () => {
    const layout = buildWorldLayout(desktop, heights);
    const start = cameraAt(layout, 0);
    // Island floor sits at 56% of the screen on load.
    expect((ISLAND.floor - start.y) * layout.scale).toBeCloseTo(desktop.height * 0.56);
    const end = cameraAt(layout, layout.documentHeight - desktop.height);
    expect(end.y + layout.view.height).toBeCloseTo(layout.bounds.bottom);
    expect(layout.chambers.map((chamber) => chamber.zone)).toEqual(['skills', 'services', 'mushroom', 'contact']);
  });

  it('pans across the surface without moving vertically, then descends', () => {
    const layout = buildWorldLayout(desktop, heights);
    const { start, end, cameraY } = layout.pan;
    expect(end).toBeGreaterThan(start);
    expect(cameraAt(layout, start).y).toBeCloseTo(cameraY);
    expect(cameraAt(layout, (start + end) / 2).y).toBeCloseTo(cameraY);
    expect(cameraAt(layout, end).x).toBeGreaterThan(cameraAt(layout, start).x);
    const below = cameraAt(layout, end + 300);
    expect(below.y - cameraY).toBeCloseTo(300 / layout.scale);
    expect(below.x).toBeCloseTo(cameraAt(layout, end).x);
  });

  it('keeps cave content locked to its chamber while the camera descends', () => {
    const layout = buildWorldLayout(desktop, heights);
    for (const zone of ['skills', 'services', 'contact'] as const) {
      const chamber = layout.chambers.find((item) => item.zone === zone)!;
      const contentTop = layout.content[zone];
      // At any scroll after the pan, content and chamber move by the same amount.
      const a = layout.pan.end + 200;
      const b = layout.pan.end + 900;
      const chamberScreen = (s: number) => (chamber.top - cameraAt(layout, s).y) * layout.scale;
      const contentScreen = (s: number) => contentTop - s;
      expect(chamberScreen(a) - contentScreen(a)).toBeCloseTo(chamberScreen(b) - contentScreen(b));
    }
  });

  it('keeps desktop chambers clear of the content column', () => {
    const layout = buildWorldLayout(desktop, heights);
    const panelLeft = desktop.width - 28 - Math.min(540, desktop.width * 0.43);
    const cameraX = cameraAt(layout, layout.pan.end).x;
    for (const chamber of layout.chambers) {
      expect((chamber.x + chamber.width - cameraX) * layout.scale).toBeLessThan(panelLeft);
      expect((chamber.x - cameraX) * layout.scale).toBeGreaterThan(-40);
    }
  });

  it('stacks cave content below each chamber on mobile', () => {
    const layout = buildWorldLayout(mobile, heights);
    expect(layout.mobile).toBe(true);
    const skills = layout.chambers[0];
    const chamberBottom = (skills.top + skills.height - layout.pan.cameraY) * layout.scale + layout.pan.end;
    expect(layout.content.skills).toBeGreaterThan(chamberBottom);
  });

  it('walks a continuous path from the island to the refuge', () => {
    const layout = buildWorldLayout(desktop, heights);
    const total = pathLength(layout);
    expect(pathPoint(layout, 0)).toMatchObject({ x: ISLAND.restX, y: ISLAND.restY });
    const end = pathPoint(layout, total);
    const refuge = layout.chambers[3];
    expect(end.y).toBeCloseTo(refuge.floorY);
    expect(end.x).toBeCloseTo(refuge.restX);
    for (let index = 1; index < layout.path.length; index += 1) {
      expect(layout.path[index].length).toBeGreaterThanOrEqual(layout.path[index - 1].length);
    }
    const climbs = layout.path.filter((node) => node.mode === 'climb');
    expect(climbs.every((node) => node.x === layout.rope.x)).toBe(true);
  });

  it('moves the adventurer target forward with the scroll', () => {
    const layout = buildWorldLayout(desktop, heights);
    let previous = -1;
    for (let s = 0; s <= layout.documentHeight; s += 50) {
      const param = targetParam(layout, s);
      expect(param).toBeGreaterThanOrEqual(previous - 1e-6);
      previous = param;
    }
    expect(targetParam(layout, 0)).toBe(0);
    expect(targetParam(layout, layout.documentHeight)).toBeCloseTo(pathLength(layout));
  });

  it('orders section targets and resolves the active section', () => {
    const layout = buildWorldLayout(desktop, heights);
    const { about, projects, skills, services, contact } = layout.sections;
    expect(about).toBeLessThan(projects);
    expect(projects).toBeLessThan(skills);
    expect(skills).toBeLessThan(services);
    expect(services).toBeLessThan(contact);
    for (const id of ['about', 'projects', 'skills', 'services', 'contact'] as const) {
      expect(activeSection(layout, layout.sections[id])).toBe(id);
    }
  });

  it('places a card above every project building but not the construction plot', () => {
    const layout = buildWorldLayout(desktop, heights);
    expect(layout.content.projects.cards.map((card) => card.id)).toEqual(['senda', 'labor-legislativa', 'cadena-arrastre', 'senda-skill']);
    for (const card of layout.content.projects.cards) {
      const building = layout.buildings.find((item) => item.id === card.id)!;
      expect(card.bottomY).toBeLessThan(building.top);
      expect(building.door).toBeDefined();
    }
  });

  it('survives an unmeasured, degenerate viewport', () => {
    const layout = buildWorldLayout({ width: 0, height: Number.NaN });
    expect(Number.isFinite(layout.documentHeight)).toBe(true);
    expect(layout.stops.length).toBeGreaterThan(3);
  });
});
