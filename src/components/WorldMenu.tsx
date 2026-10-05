import '../navigation.css';

interface WorldMenuProps {
  onEnter: () => void;
  entered?: boolean;
  skyOffset?: number;
}

export function WorldMenu({ onEnter, entered = false, skyOffset = 0 }: WorldMenuProps) {
  return (
    <section
      className={`world-menu${entered ? ' world-menu--entered' : ''}`}
      aria-labelledby="world-menu-title"
      data-ui-overlay="true"
    >
      <div className="world-menu__content">
        <h1 id="world-menu-title" className="world-menu__title">
          <img
            src="/assets/identity/marto-title-v1.png"
            alt="Marto Gavotti"
            style={entered ? { transform: `translateY(-${Math.max(0, skyOffset)}px)` } : undefined}
          />
        </h1>
        {!entered ? (
          <button className="world-menu__enter" type="button" onClick={onEnter}>
            Entrar al mundo
          </button>
        ) : null}
      </div>
    </section>
  );
}
