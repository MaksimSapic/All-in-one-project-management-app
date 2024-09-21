import { Member } from './Member';
import { Project } from './Project';
import { ProjectSection } from './ProjectSection';
import { TaskDependency } from './TaskDependency';

export interface ProjectTask {
  id: number;
  taskName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  statusName: string;
  sectionName: string;
  projectId: number;
  firstName?: string;
  lastName?: string;
  project: Project;
  projectRole?: string;
  dependencies?:TaskDependency;
  profilePicUrl?: string;
  selected?: boolean;
  appUserId?:number;
  appUser?:Member;
  senderid?:number;
  projectSection:ProjectSection
}