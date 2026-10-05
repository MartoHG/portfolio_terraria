import { JOURNEY_SECTIONS, type SectionId } from './journey';

export interface DocumentJourneyStop {
  id: SectionId;
  worldY: number;
  scrollStart: number;
  scrollEnd: number;
}

export interface DocumentJourney {
  positions: Record<SectionId, number>;
  stops: DocumentJourneyStop[];
  height: number;
}

export interface DocumentJourneySample {
  worldY: number;
  section: SectionId;
}

/** Places readable content in view-sized plateaus connected by camera travel. */
export function buildDocumentJourney(
  viewportHeight: number,
  sectionHeights: Partial<Record<SectionId, number>>,
): DocumentJourney {
  const viewport = Number.isFinite(viewportHeight) ? Math.max(1, viewportHeight) : 1;
  const positions = {} as Record<SectionId, number>;
  const stops: DocumentJourneyStop[] = [];
  let previousTop = 0;
  let previousHeight = 0;

  for (const [index, section] of JOURNEY_SECTIONS.entries()) {
    const sectionHeight = Number.isFinite(sectionHeights[section.id])
      ? Math.max(0, sectionHeights[section.id] ?? 0)
      : 0;
    const top = index === 0
      ? viewport * 0.16
      : Math.max(viewport * 0.16, previousTop + previousHeight + viewport * 0.85);
    const scrollStart = index === 0 ? 0 : top - viewport * 0.16;
    const scrollEnd = scrollStart + Math.max(0, sectionHeight - viewport * 0.6);

    positions[section.id] = top;
    stops.push({ id: section.id, worldY: section.worldY, scrollStart, scrollEnd });
    previousTop = top;
    previousHeight = sectionHeight;
  }

  const lastStop = stops[stops.length - 1];
  return {
    positions,
    stops,
    height: lastStop ? lastStop.scrollEnd + viewport : viewport,
  };
}

/** Samples the camera destination while preserving a stationary reading plateau. */
export function sampleDocumentJourney(
  scrollY: number,
  stops: readonly DocumentJourneyStop[],
): DocumentJourneySample {
  const first = stops[0];
  if (!first) return { worldY: 0, section: 'about' };
  const scroll = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  if (scroll <= first.scrollEnd) return { worldY: first.worldY, section: first.id };

  for (let index = 0; index < stops.length - 1; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];
    if (!current || !next) continue;
    if (scroll <= current.scrollEnd) return { worldY: current.worldY, section: current.id };
    if (scroll < next.scrollStart) {
      const span = next.scrollStart - current.scrollEnd;
      const progress = span <= 0 ? 1 : (scroll - current.scrollEnd) / span;
      return {
        worldY: current.worldY + (next.worldY - current.worldY) * progress,
        section: progress >= 0.5 ? next.id : current.id,
      };
    }
    if (scroll <= next.scrollEnd) return { worldY: next.worldY, section: next.id };
  }

  const last = stops[stops.length - 1] ?? first;
  return { worldY: last.worldY, section: last.id };
}
