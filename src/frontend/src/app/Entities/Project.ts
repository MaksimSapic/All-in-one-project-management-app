export interface Project {
  id: number;
  projectName: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  projectStatus: ProjectStatus;
  progress: number;
}

export enum ProjectStatus {
  Proposed,
  InProgress,
  Completed,
  Archived,
}