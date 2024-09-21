export interface ArchivedProject {
    id: number;
    projectName: string;
    startDate: Date;
    endDate: Date;
    ownerFirstName?: string;
    ownerLastName?: string;
    ownerProfilePicture?: string;
    selected?: boolean;
}