import { SKILL_ICONS } from '../world/vertical/assets';

/** Terraria-style item icons for the skills inventory (index in the skill-icons sheet). */
const SKILL_ICON_INDEX: Record<string, number> = {
  PHP: 0,
  Laravel: 1,
  JavaScript: 2,
  'HTML · CSS': 3,
  MySQL: 4,
  Git: 5,
  'Python — algoritmos y estructuras de datos': 6,
  'Análisis y modelado de sistemas (UML · DER)': 7,
  React: 8,
  Django: 9,
};

/** One tool per workshop station. */
const SERVICE_ICON_INDEX: Record<string, number> = {
  management: 12,
  web: 14,
  support: 11,
};

export function skillIcon(item: string): string | undefined {
  const index = SKILL_ICON_INDEX[item];
  return index === undefined ? undefined : SKILL_ICONS[index];
}

export function serviceIcon(id: string): string | undefined {
  const index = SERVICE_ICON_INDEX[id];
  return index === undefined ? undefined : SKILL_ICONS[index];
}
