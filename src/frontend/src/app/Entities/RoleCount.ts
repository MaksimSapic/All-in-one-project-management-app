import { Member } from "./Member";

export interface RoleCount {
    adminCount: number;
    memberCount: number;
    projectManagerCount: number;
    admins: Member[];
    members: Member[];
    pManagers: Member[];
}