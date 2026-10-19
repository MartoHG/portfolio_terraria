import { JOURNEY_SECTIONS, type SectionId } from '../world/journey';
import { SKILL_ICONS } from '../world/vertical/assets';
import '../navigation.css';

interface WorldNavigationProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

// Each zone holds one item in its slot, as in a Terraria hotbar.
const SLOT_ICONS: Record<SectionId, string> = {
  about: SKILL_ICONS[12],
  projects: SKILL_ICONS[10],
  skills: SKILL_ICONS[2],
  services: SKILL_ICONS[11],
  contact: SKILL_ICONS[15],
};
const RETURN_ICON = '/assets/scene-v3/magic-mirror-item.png';

export function WorldNavigation({ activeSection, onNavigate }: WorldNavigationProps) {
  return (
    <nav className="world-navigation" aria-label="Navegación del mundo" data-ui-overlay="true">
      <ul className="world-hotbar">
        {JOURNEY_SECTIONS.map(({ id, label }, index) => (
          <li key={id}>
            <button
              className="world-hotbar__slot"
              type="button"
              aria-label={`Ir a ${label}`}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={() => onNavigate(id)}
            >
              <span className="world-hotbar__index" aria-hidden="true">{index + 1}</span>
              <img className="world-hotbar__icon" src={SLOT_ICONS[id]} alt="" aria-hidden="true" draggable={false} />
              <span className="world-hotbar__label">{label}</span>
            </button>
          </li>
        ))}
        {activeSection === 'contact' ? (
          <li className="world-hotbar__return">
            <button
              className="world-hotbar__slot world-hotbar__slot--return"
              type="button"
              aria-label="Volver al cielo"
              onClick={() => onNavigate('about')}
            >
              <img className="world-hotbar__icon" src={RETURN_ICON} alt="" aria-hidden="true" draggable={false} />
              <span className="world-hotbar__label world-hotbar__label--long">Volver al cielo</span>
              <span className="world-hotbar__label world-hotbar__label--short" aria-hidden="true">Cielo</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
