import '../audio.css';

interface SoundControlProps {
  muted: boolean;
  onToggle: () => void;
  disabled?: boolean;
  unavailable?: boolean;
}

export function SoundControl({ muted, onToggle, disabled = false, unavailable = false }: SoundControlProps) {
  const unavailableMessage = unavailable ? 'El sonido no está disponible en este navegador' : undefined;
  return (
    <button
      className="sound-control"
      type="button"
      aria-label={unavailable ? unavailableMessage : muted ? 'Activar sonido ambiental' : 'Silenciar sonido ambiental'}
      aria-pressed={!muted && !unavailable}
      title={unavailableMessage ?? (muted ? 'Activar sonido ambiental' : 'Silenciar sonido ambiental')}
      onClick={onToggle}
      disabled={disabled || unavailable}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M3 9v6h4l5 4V5L7 9H3Z" />
        {muted || unavailable ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 9a4 4 0 0 1 0 6" /><path d="M17 6a8 8 0 0 1 0 12" /></>}
      </svg>
      <span>Sonido</span>
      <span className="sound-control-state">{unavailable ? 'No disponible' : muted ? 'Silenciado' : 'Activo'}</span>
    </button>
  );
}

export type { SoundControlProps };
