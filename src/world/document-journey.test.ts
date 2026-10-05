import { describe, expect, it } from 'vitest';
import { buildDocumentJourney, sampleDocumentJourney } from './document-journey';

describe('document journey layout', () => {
  it('starts the first reading area near the top and leaves enough scroll for contact', () => {
    const journey = buildDocumentJourney(1000, {
      about: 1400,
      projects: 1800,
      skills: 900,
      services: 1100,
      contact: 700,
    });
    const first = journey.stops[0];
    const last = journey.stops.at(-1);

    expect(journey.positions.about).toBe(160);
    expect(first?.scrollStart).toBe(0);
    expect(journey.height - 1000).toBe(last?.scrollEnd);
  });

  it('keeps section tops separated by the previous content height and reading buffer', () => {
    const journey = buildDocumentJourney(1000, {
      about: 500,
      projects: 12000,
      skills: 900,
      services: 800,
      contact: 750,
    });

    expect(journey.positions.projects).toBeGreaterThanOrEqual(journey.positions.about + 500 + 850);
    expect(journey.positions.skills).toBeGreaterThanOrEqual(journey.positions.projects + 12000 + 850);
    expect(journey.stops[0]?.scrollEnd).toBeLessThan(journey.stops[1]?.scrollStart ?? 0);
  });

  it('holds the world destination during reading and interpolates between stops in either direction', () => {
    const { stops } = buildDocumentJourney(1000, {
      about: 2000,
      projects: 1000,
      skills: 1000,
      services: 1000,
      contact: 1000,
    });
    const about = stops[0];
    const projects = stops[1];
    expect(about).toBeDefined();
    expect(projects).toBeDefined();
    if (!about || !projects) return;

    expect(sampleDocumentJourney(about.scrollEnd, stops)).toEqual({ worldY: about.worldY, section: 'about' });

    const middleScroll = (about.scrollEnd + projects.scrollStart) / 2;
    const middle = sampleDocumentJourney(middleScroll, stops);
    expect(middle.worldY).toBeCloseTo((about.worldY + projects.worldY) / 2);
    expect(middle.section).toBe('projects');
    expect(sampleDocumentJourney(middleScroll - 100, stops).worldY)
      .toBeLessThan(sampleDocumentJourney(middleScroll + 100, stops).worldY);

    expect(sampleDocumentJourney(-50, stops)).toEqual({ worldY: about.worldY, section: 'about' });
    expect(sampleDocumentJourney(Number.MAX_SAFE_INTEGER, stops).section).toBe('contact');
  });
});
