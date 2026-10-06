import type { Ref } from 'react';

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

/** Where the projects stage sits in the document and where each card hangs in it. */
export interface ProjectStagePlacement {
  top: number;
  height: number;
  /** Card anchors: x is the world position in CSS pixels (before panning), y the stage-local bottom edge. */
  heading: { x: number; y: number };
  cards: Record<string, { x: number; y: number }>;
}

export interface ContentProps {
  activeSection?: SectionId;
  onNavigate: (sectionId: SectionId) => void;
  onProjectOpen?: (projectId: string) => void;
  onReturnToSky?: () => void;
  sectionPositions?: Partial<Record<SectionId, number>>;
  projectStage?: ProjectStagePlacement;
  /** Receives the stage element so the app can pan it with the camera. */
  projectStageRef?: Ref<HTMLDivElement>;
  /** A card received keyboard focus while possibly off-screen. */
  onProjectFocus?: (projectId: string) => void;
}
