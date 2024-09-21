export interface Notification {
  id: number;
  reciever_id: number;
  sender_id:number,
  dateTime: Date;
  type: number;
  read: boolean;
  sender_firstname?:string;
  sender_lastname?:string;
}