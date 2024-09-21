export interface ChangeRole{
    Id: number,
    Role: UserRole
}
export enum UserRole {
    Admin,
    ProjectManager,
    User
}