import { SKILL_STORY } from './portfolio';
import type { PortfolioProject } from './types';

const asset = (path: string) => `/assets/${path}`;

export const PROJECTS: PortfolioProject[] = [
  {
    id: 'senda',
    title: 'Senda',
    kind: 'Proyecto grupal · Sistema de gestión educativa',
    status: 'En desarrollo — primeros avances presentados al cliente',
    summary: 'Gestión escolar de punta a punta, con información cargada una sola vez y documentos legales generados automáticamente.',
    problem: 'Las instituciones educativas registran su actividad diaria a mano: planillas dispersas, doble carga de datos y documentos obligatorios —como el RITE y el libro de temas— que se arman copiando información que ya existe en otro lado.',
    solution: 'Un sistema que cubre la gestión escolar de punta a punta: instituciones, cursos, materias, docentes, estudiantes, asistencia, calificaciones, intensificaciones y planes de acompañamiento. Con esa información cargada una sola vez, el sistema genera automáticamente los documentos legales —el libro de temas y, sobre todo, el RITE, el corazón del sistema— en lugar de armarlos a mano.',
    role: 'En la documentación trabajé a la par del equipo, en las mismas etapas de relevamiento y modelado de dominio. En el desarrollo construí varios módulos de punta a punta: configuración institucional (instituciones, turnos y modelos de intensificación); roles y permisos con Spatie Permission para directivos, preceptores y docentes; libro de temas con generación del PDF legal; RITE con asistencia, calificaciones e intensificaciones; y asistencia institucional y por materia, actualmente en desarrollo junto a otros compañeros. Los módulos de estudiantes, calificaciones y resoluciones fueron desarrollados por mis compañeros de equipo.',
    stack: ['PHP', 'Laravel 12', 'MySQL', 'Bootstrap', 'HTMX', 'Spatie Permission', 'Pest'],
    details: [
      { heading: 'Base técnica', body: 'Arquitectura por dominios (Curso, Estudiante, Asistencia, Calificación, Intensificación, EDTE), cobertura de tests con Pest y generación de PDFs con dompdf.' },
    ],
    images: [
      ['senda/senda-01-login.webp', 'Pantalla de inicio de sesión de Senda'],
      ['senda/senda-02-dashboard.webp', 'Panel principal con accesos a estudiantes, resoluciones, cursos y personal'],
      ['senda/senda-16-institucion.webp', 'Configuración de la institución: identificación, ubicación y turnos'],
      ['senda/senda-15-configuracion.webp', 'Panel de configuración: roles, resoluciones, institución, EDTE y periodos'],
      ['senda/senda-20-periodos.webp', 'Listado de períodos de intensificación por fecha'],
      ['senda/senda-17-roles.webp', 'Roles del sistema con sus permisos asignados mediante Spatie Permission'],
      ['senda/senda-18-nuevo-rol.webp', 'Formulario para crear un rol y asignarle permisos agrupados'],
      ['senda/senda-19-personal.webp', 'Listado de personal de la institución con documento y estado de cuenta'],
      ['senda/senda-06-cursos.webp', 'Listado de cursos con resolución, año y sección'],
      ['senda/senda-07-curso-detalle.webp', 'Detalle de curso con preceptores a cargo'],
      ['senda/senda-08-resoluciones.webp', 'Gestión de resoluciones, formación general y tecnicaturas'],
      ['senda/senda-03-estudiantes.webp', 'Listado de estudiantes con documento, fechas y estado'],
      ['senda/senda-04-estudiante-perfil.webp', 'Perfil del estudiante con sus datos personales'],
      ['senda/senda-10-gestion-diaria.webp', 'Selección de curso para gestionar libro de temas, calificaciones y asistencia'],
      ['senda/senda-11-gestion-diaria-curso.webp', 'Materias de un curso con accesos a libro de temas, calificaciones y asistencia'],
      ['senda/senda-12-libro-temas.webp', 'Libro de temas completo de un curso, organizado por materia'],
      ['senda/senda-13-libro-temas-clases.webp', 'Clases registradas de una materia con contenidos y observaciones'],
      ['senda/senda-14-registrar-clase.webp', 'Formulario para registrar una clase dictada'],
      ['senda/senda-09-calificaciones.webp', 'Carga de calificaciones por cuatrimestre e intensificación'],
      ['senda/senda-05-rite.webp', 'Vista previa del RITE con calificaciones y materias pendientes'],
    ].map(([path, alt]) => ({ src: asset(path), alt })),
  },
  {
    id: 'labor-legislativa',
    title: 'Plataforma de labor legislativa',
    kind: 'Proyecto individual · Desarrollo comercial',
    status: 'Finalizado — en revisión',
    summary: 'Un catálogo público y una administración de proyectos y ordenanzas con búsqueda, filtros y documentos oficiales.',
    problem: 'Un concejal necesitaba una forma moderna y transparente de publicar su labor —proyectos y ordenanzas— y que los vecinos pudieran encontrarla, consultarla y compartirla con facilidad. Hasta entonces esa información estaba dispersa y era difícil de difundir.',
    solution: 'Una plataforma web con un catálogo público de proyectos y ordenanzas —tarjetas con imagen, categoría y fecha—, un buscador con filtros por tipo y categoría y ordenamiento, y una ficha individual de cada iniciativa. Cada proyecto se comparte por enlace directo y código QR, y adjunta su PDF oficial. Un panel de administración con roles (administrador y colaborador) permite cargar, editar y gestionar los proyectos y los usuarios.',
    role: 'Lo desarrollé de punta a punta, en solitario: modelado de datos, sitio público con buscador, panel de administración con roles tipados y policies de permisos, ABM de proyectos con carga de PDF y generación automática del código QR, imágenes de portada y una capa de servicios cubierta con tests.',
    stack: ['PHP', 'Laravel 12', 'MySQL', 'Tailwind CSS', 'Alpine.js', 'Blade'],
    images: [
      { src: asset('santana-catalogo.webp'), alt: 'Catálogo público: tarjetas de proyectos y ordenanzas con categoría y fecha' },
      { src: asset('santana-buscador.webp'), alt: 'Buscador legislativo con filtros por tipo, categoría y ordenamiento' },
      { src: asset('santana-panel.webp'), alt: 'Panel de administración: métricas y últimos documentos cargados' },
    ],
  },
  {
    id: 'cadena-arrastre',
    title: 'Estación de visión para cadena de arrastre',
    kind: 'Proyecto en equipo · Hackathon industrial · Visión por computadora',
    status: '2.º puesto — LOMATÓN 2026, Olavarría',
    summary: 'Una estación fija inspecciona cada eslabón de la cadena y conserva un historial de salud individual.',
    problem: 'En la línea de calcinación del horno 6 de la planta de Olavarría, la cal a granel viaja por un redler: cuatro cadenas de arrastre y unos 200 metros de recorrido. Si una cadena se corta, la línea para. Hoy la rotura se detecta con una persona que recorre el equipo en marcha cada dos horas y mira, entre polvo de cal y calor. Eso deja ventanas ciegas de dos horas, depende del criterio de cada operador y expone gente al ambiente sólo para observar. Y lo que hay que encontrar es chico: un perno flojo, una chaveta que falta, un eslabón fisurado, repartidos entre miles de eslabones.',
    solution: 'La cadena es un circuito cerrado. No hay que instrumentar 200 metros: alcanza con una estación de visión fija y dejar que la cadena pase por delante. En una vuelta completa queda inspeccionado el 100 % de los eslabones. El movimiento lo pone el proceso, no el algoritmo.',
    role: 'La idea la planteé yo: la cadena como circuito cerrado, una estación de visión fija en lugar de instrumentar 200 metros, y el historial de salud por eslabón. Y el prototipo lo construí completo, de la calibración sobre los videos reales de planta a la detección, el autodiagnóstico de calidad de imagen y la maqueta de indexación.',
    stack: ['Python', 'OpenCV (visión clásica, sin modelos entrenados)', 'NumPy', 'Streamlit'],
    details: [
      { heading: 'Tres capas complementarias', body: 'Capa 0: hardware determinístico (sensores magnéticos, underspeed switches, pares de sensores inductivos y monitoreo de corriente del motor) para protección de corte duro, siempre activa y sin depender de IA. Etapa A: medición matemática de elongación frente al umbral estándar de reemplazo del 2 al 3 %, funcional desde el primer día sin dataset. Etapa B: machine learning incorporado gradualmente cuando el sistema acumule datos propios.' },
      { heading: 'Indexación de eslabones', body: 'Cada eslabón recibe un ID persistente y un historial de salud propio. Así el sistema puede señalar que el eslabón 412 lleva seis días con elongación creciente, en vez de limitarse a indicar una falla en la cadena 3. La trazabilidad también genera los datos que habilitan la Etapa B.' },
      { heading: 'La demo', body: 'Visión clásica con OpenCV sobre video real de la planta, corriendo local y sin entrenar nada. Como no existe un dataset de fallas —cuando falta una chaveta, se arregla y se sigue— se pintó a mano un travesaño amarillo sobre la cadena real y se usó el color como reemplazo del defecto para construir y validar toda la cadena de procesamiento: ventana de inspección, umbrales, agrupación de eventos y alertas. Con fallas reales se podrá cambiar el detector y conservar el resto del sistema.' },
      { heading: 'Decisiones de seguridad y medición', body: 'La ventana de inspección fija vuelve selectiva la detección: con el mismo umbral hubo cero eventos en el video sano y dos en el de defecto. El autodiagnóstico mide nitidez y avisa “no puedo verificar este segmento” en lugar de decir “sano”: un falso “todo bien” por una lente sucia es peor que no tener sensor. Como métrica experimental aparte, se midió el paso entre pernos con HoughCircles como proxy de elongación de la Etapa A. El principal desafío fue conseguir contraste visual en el video.' },
      { heading: 'Contexto', body: 'Hackathon organizado por Loma Negra, la Fundación Loma Negra, Ferrosur y la FIO/UNICEN, el 26 y 27 de agosto de 2026 en Olavarría. Desafío 2, “¡Que no pare, que no pare!”. Presentado como CHAIN TEAM; segundo puesto.' },
    ],
    repository: { label: 'Ver en GitHub', href: 'https://github.com/MartoHG/LOMATON---CHAIN-TEAM' },
    images: [
      { src: asset('lomaton/lomaton-01-deteccion.webp'), alt: 'Tres cuadros del detector: cadena real sin defecto, travesaño pintado marcado como falta de chaveta y tramo fuera de foco marcado como calidad insuficiente' },
      { src: asset('lomaton/lomaton-02-indexacion.webp'), alt: 'Diagrama del circuito cerrado de la cadena: estación de visión fija, encoder en la rueda motriz y eslabones numerados con su estado de salud' },
    ],
  },
];

export const SKILL_PROJECT: PortfolioProject = {
  id: 'senda-skill',
  title: SKILL_STORY.title,
  kind: 'Skill reutilizable',
  status: 'Skill reutilizable para agentes de IA',
  summary: 'Una skill que documenta la convención del equipo de Senda para construir módulos en paralelo.',
  problem: 'Cuando en Senda varias personas empezamos a construir módulos en paralelo, hacía falta un acuerdo compartido para que todo encajara sin descubrir desalineaciones recién al integrar.',
  solution: 'Documenté esa convención de equipo —fragments de Blade, IDs de contenedores, eventos HX-Trigger— bajo un principio rector: el estado de la interfaz lo decide el backend, nunca JavaScript en el cliente.',
  role: 'La empaqueté como skill reutilizable para agentes de IA como Claude Code.',
  stack: ['Blade', 'HTMX', 'HX-Trigger'],
  repository: { label: SKILL_STORY.linkLabel, href: SKILL_STORY.link },
  images: [],
};

export function getProject(id: string) {
  return id === SKILL_PROJECT.id ? SKILL_PROJECT : PROJECTS.find((project) => project.id === id);
}
