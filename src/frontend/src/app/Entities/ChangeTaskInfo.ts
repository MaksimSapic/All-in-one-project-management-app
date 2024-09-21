export interface ChangeTaskInfo {
    id: number;
    taskName?: string;
    description?: string;
    appUserId?: number | null;
    dueDate?: Date | null;
    projectEndDate?: Date | null;
    projectId: number;
    sectionId:number;
}