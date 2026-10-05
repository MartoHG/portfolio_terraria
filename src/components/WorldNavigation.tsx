import { JOURNEY_SECTIONS, type SectionId } from '../world/journey';
import '../navigation.css';

interface WorldNavigationProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

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
              <span className="world-hotbar__label">Volver al cielo</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
