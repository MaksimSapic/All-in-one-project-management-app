export interface ProjectMember {
    AppUserId: number,
    ProjectId: number,
    ProjectRole: ProjectRole
}
export enum ProjectRole {
    ProjectManager,
    ProjectOwner,
    Manager,
    Participant,
    Guest
}