export interface Member {
    id:number,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    token: string,
    role: UserRole,
    archived:boolean,
    profilePicUrl:string,
    url?:string
}
export enum UserRole {
    Admin,
    Member,
    ProjectManager
}