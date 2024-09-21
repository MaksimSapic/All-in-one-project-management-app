export interface NewTask {
    CreatorId: number;
    TaskName: string,
    Description: string,
    StartDate: Date,
    EndDate: Date,
    AppUserId: number,
    ProjectId: number,
    ProjectSectionId: number,
}