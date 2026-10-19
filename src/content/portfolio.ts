export const PROFILE = {
  name: 'Martiniano Gavotti',
  title: 'Desarrollador Full Stack',
  tagline: 'Convierto procesos de papel en sistemas que funcionan.',
  introduction: 'Desarrollador full stack (PHP · Laravel) y analista de sistemas en el último año de la carrera. Diseño, modelo y construyo software de gestión de punta a punta: del relevamiento a la entrega.',
  about: 'Soy Martiniano, desarrollador de Argentina. Me estoy formando como Analista en Sistemas —cursando último año de la carrera— y me especializo en sistemas de gestión: software que ordena el trabajo diario de organizaciones reales. Programo para ordenar el caos: me gusta convertir procesos manuales en sistemas que funcionan solos. Vengo del análisis de sistemas, así que pienso el software antes de escribirlo. Con muchas ganas de sumarme a un equipo y aprender de gente con más recorrido.',
  photo: '/assets/foto.jpg',
  photoAlt: 'Martiniano Gavotti, de traje',
};

export const EDUCATION = [
  { date: '2024', label: 'Inicio de la carrera Analista en Sistemas' },
  { date: 'Ene 2026', label: 'Primer proyecto comercial como desarrollador' },
  { date: '2026', label: 'Senda: primeros avances presentados al cliente · último año de la carrera' },
];

export const SKILL_GROUPS = [
  { id: 'principal', title: 'Stack principal', note: 'Uso a diario', items: ['PHP', 'Laravel', 'JavaScript', 'HTML · CSS', 'MySQL', 'Git'] },
  { id: 'solida', title: 'Base sólida', note: '', items: ['Python — algoritmos y estructuras de datos', 'Análisis y modelado de sistemas (UML · DER)'] },
  { id: 'aprendizaje', title: 'En aprendizaje', note: '', items: ['React', 'Django'] },
];

export const SKILL_STORY = {
  id: 'skill-blade-htmx',
  title: 'De Senda a una skill',
  body: 'Cuando en Senda varias personas empezamos a construir módulos en paralelo, hacía falta un acuerdo compartido para que todo encajara sin descubrir desalineaciones recién al integrar. Documenté esa convención de equipo —fragments de Blade, IDs de contenedores, eventos HX-Trigger— bajo un principio rector: el estado de la interfaz lo decide el backend, nunca JavaScript en el cliente. La empaqueté como skill reutilizable para agentes de IA como Claude Code.',
  link: 'https://github.com/MartoHG/laravel-htmx-patterns',
  linkLabel: 'Ver skill en GitHub',
};

export const SERVICES = [
  { id: 'management', station: 'Mesa de planos', title: 'Sistemas de gestión a medida', description: 'Software que ordena procesos reales: registros, turnos, stock, reportes. Relevamiento incluido — primero entiendo tu proceso, después lo programo.' },
  { id: 'web', station: 'Banco de trabajo', title: 'Sitios y aplicaciones web', description: 'Desarrollo web completo, del diseño a la puesta online. Sitios rápidos, claros y fáciles de mantener.' },
  { id: 'support', station: 'Estación de reparación', title: 'Soporte y evolución', description: 'Mejoras, corrección de errores y nuevas funciones sobre sistemas que ya están en uso.' },
];

export const CONTACT = {
  title: '¿Hablamos?',
  description: 'Busco mi primer puesto formal como desarrollador y también tomo proyectos freelance. Si tenés una propuesta, una búsqueda o simplemente una duda, escribime — respondo.',
  email: 'marticontacto21@gmail.com',
  linkedin: 'https://www.linkedin.com/in/martiniano-gavotti-538bba18b',
  github: 'https://github.com/MartoHG',
};
