import type { SectionId } from '../content/types';

export type { SectionId } from '../content/types';

export interface JourneySection {
  id: SectionId;
  label: string;
}

/** The five zones of the descent, in world order; the hotbar mirrors them. */
export const JOURNEY_SECTIONS: readonly JourneySection[] = [
  { id: 'about', label: 'Sobre mí' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'skills', label: 'Skills' },
  { id: 'services', label: 'Servicios' },
  { id: 'contact', label: 'Contacto' },
];
