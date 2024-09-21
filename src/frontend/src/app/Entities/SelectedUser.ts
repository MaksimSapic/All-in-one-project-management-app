import { ProjectRole } from "./ProjectMember";

export interface SelectedUser {
    appUserId:number,
    name: string,
    email: string,
    projectRole: ProjectRole,
    profilePicUrl: string,
    profilePic?: string
    archived?: boolean
}