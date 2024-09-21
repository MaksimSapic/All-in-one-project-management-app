import {  ProjectStatus } from "./Project";

export interface UpdateProject {
    projectId?: number,
    appUserId?: number;
    projectName?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    projectStatus?: ProjectStatus;
}