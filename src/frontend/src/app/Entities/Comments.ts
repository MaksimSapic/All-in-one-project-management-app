export interface Comment {
  id: number;
  taskId: number;
  content: string;
  messageSent?: Date; 
  senderId: number;
  senderFirstName: string;
  senderLastName: string;
  fileUrl?: string;
  edited: boolean;
  appUserPicUrl?:any;
}