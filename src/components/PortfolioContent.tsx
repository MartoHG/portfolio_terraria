import type { CSSProperties } from 'react';
import { CONTACT, EDUCATION, PROFILE, SERVICES, SKILL_GROUPS, SKILL_STORY } from '../content/portfolio';
import { PROJECTS, SKILL_PROJECT } from '../content/projects';
import type { ContentProps, SectionId } from '../content/types';
import '../portfolio.css';

function sectionStyle(id: SectionId, positions?: ContentProps['sectionPositions']): CSSProperties {
  const top = positions?.[id];
  return top === undefined ? {} : { top };
}

export function PortfolioContent({ activeSection, onNavigate, onProjectOpen, onReturnToSky, sectionPositions }: ContentProps) {
  const markActive = (id: SectionId) => ({
    className: `portfolio-section${activeSection === id ? ' is-active' : ''}`,
    id,
    'data-section': id,
    'aria-current': activeSection === id ? 'location' as const : undefined,
    style: sectionStyle(id, sectionPositions),
  });

  return (
    <div className="portfolio-content" aria-label="Portfolio de Martiniano Gavotti">
      <section {...markActive('about')} aria-labelledby="portfolio-about-title">
        <p className="portfolio-kicker">Zona N.º 01 · Isla del cielo</p>
        <div className="about-layout">
          <div>
            <h2 id="portfolio-about-title">Sobre mí</h2>
          </div>
          <img className="profile-photo" src={PROFILE.photo} alt={PROFILE.photoAlt} loading="lazy" />
        </div>
        <p className="about-lead">{PROFILE.introduction}</p>
        <p className="about-copy">{PROFILE.about}</p>
        <div className="education-block">
          <h3>Formación y recorrido</h3>
          <ol className="education-list">
            {EDUCATION.map((item) => <li key={item.date}><time>{item.date}</time><span>{item.label}</span></li>)}
          </ol>
        </div>
      </section>

      <section {...markActive('projects')} aria-labelledby="portfolio-projects-title">
        <p className="portfolio-kicker">Zona N.º 02 · Aldea de la superficie</p>
        <h2 id="portfolio-projects-title">Proyectos</h2>
        <div className="project-buildings">
          {PROJECTS.map((project, index) => (
            <article className="content-card project-card" key={project.id}>
              <p className="card-index">Ficha {String(index + 1).padStart(2, '0')}</p>
              <h3>{project.title}</h3>
              <p className="card-meta">{project.kind}</p>
              <p className="card-status">{project.status}</p>
              <p>{project.summary}</p>
              <button className="pixel-button" type="button" onClick={() => onProjectOpen?.(project.id)} aria-label={`Abrir detalles de ${project.title}`}>
                Explorar proyecto <span aria-hidden="true">↗</span>
              </button>
            </article>
          ))}
          <article className="content-card skill-story-card">
            <p className="card-index">Edificio especial</p>
            <h3>{SKILL_PROJECT.title}</h3>
            <p>{SKILL_PROJECT.summary}</p>
            <button className="pixel-button" type="button" onClick={() => onProjectOpen?.(SKILL_PROJECT.id)} aria-label={`Abrir detalles de ${SKILL_PROJECT.title}`}>
              Explorar skill <span aria-hidden="true">↗</span>
            </button>
            <a className="skill-repository-link" href={SKILL_STORY.link} target="_blank" rel="noreferrer">{SKILL_STORY.linkLabel} <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>

      <section {...markActive('skills')} aria-labelledby="portfolio-skills-title">
        <p className="portfolio-kicker">Zona N.º 03 · Inventario de cueva</p>
        <h2 id="portfolio-skills-title">Skills</h2>
        <p>Prefiero decirte exactamente qué manejo y qué estoy aprendiendo.</p>
        <div className="skill-inventory">
          {SKILL_GROUPS.map((group) => (
            <article className="content-card skill-group" key={group.id}>
              <h3>{group.title}</h3>
              {group.note && <p className="card-meta">{group.note}</p>}
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section {...markActive('services')} aria-labelledby="portfolio-services-title">
        <p className="portfolio-kicker">Zona N.º 04 · Taller subterráneo</p>
        <h2 id="portfolio-services-title">Servicios</h2>
        <p>Además de buscar mi primer puesto formal, tomo proyectos freelance.</p>
        <div className="service-stations">
          {SERVICES.map((service) => (
            <article className="content-card service-card" key={service.id}>
              <p className="card-meta">{service.station}</p>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section {...markActive('contact')} aria-labelledby="portfolio-contact-title">
        <p className="portfolio-kicker">Zona N.º 05 · Refugio profundo</p>
        <h2 id="portfolio-contact-title">{CONTACT.title}</h2>
        <p>{CONTACT.description}</p>
        <div className="contact-links" aria-label="Canales de contacto">
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
          <a href={CONTACT.github} target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
        <button className="pixel-button" type="button" onClick={() => onReturnToSky ? onReturnToSky() : onNavigate('about')}>Volver al cielo <span aria-hidden="true">↑</span></button>
      </section>
    </div>
  );
}

export type { ContentProps, SectionId };
