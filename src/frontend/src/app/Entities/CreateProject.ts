import { ProjectStatus } from "./Project";

export interface CreateProject {
    ProjectName: string;
    Description?: string;
    StartDate?: Date;
    EndDate?: Date;
    ProjectStatus?: ProjectStatus;
    AppUserId?: Int16Array;
}