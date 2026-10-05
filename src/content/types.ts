export type SectionId = 'about' | 'projects' | 'skills' | 'services' | 'contact';

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectDetail {
  heading: string;
  body: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  kind: string;
  status: string;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  stack: string[];
  details?: ProjectDetail[];
  images: ProjectImage[];
  repository?: { label: string; href: string };
}

export interface ContentProps {
  activeSection?: SectionId;
  onNavigate: (sectionId: SectionId) => void;
  onProjectOpen?: (projectId: string) => void;
  onReturnToSky?: () => void;
  sectionPositions?: Partial<Record<SectionId, number>>;
}
