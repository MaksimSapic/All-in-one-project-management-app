import * as SignalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { Injectable} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CustomToastService } from './custom-toast.service';
import { SharedService } from './shared.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService{
  hubUrl = environment.hubUrl;
  newNotifications:boolean = false;
  private hubConnection?:SignalR.HubConnection;

  notifications : Notification[] = [];
  allNotifications:Notification[] = [];

  constructor(
    private customToast:CustomToastService,
    private shared:SharedService,
    private router:Router
  ) { }

  createHubConnection(){
    var token = localStorage.getItem('token');
    this.hubConnection = new SignalR.HubConnectionBuilder()

      .withUrl(this.hubUrl+'notifications', {
        accessTokenFactory: () => token ? token : ''
      })

      .withAutomaticReconnect([0,3000,5000])
      .configureLogging(SignalR.LogLevel.None)
      .build();
    this.hubConnection.start().catch(error =>{
    });

    this.hubConnection.on('newNotifications',() =>{
      this.newNotifications = true;
    });

    this.hubConnection.on('Notify',(notification:any)=>{
      this.notifications.push(notification); // ide u listu real-time notifikacija
      this.allNotifications.push(notification); // lista neprocitanih u tabeli
      this.newNotifications = true;
      this.customToast.initiate(
        {
          target:notification,
          title:'New Notification!',
          content:this.getNotificationText_small(notification)
        }
      )
    })
    this.hubConnection.on('recieveNotifications',(notifications:[Notification])=>{
      this.notifications = notifications;
    });

    this.hubConnection.on('recieveAllNotifications',(notifications:[Notification])=>{
      this.allNotifications = notifications; // pokupim sve u niz
    })
    this.hubConnection.on("notifyState",(response:any)=>{
      this.newNotifications = response;
    })
  }
  stopHubConnection(){
    this.hubConnection?.stop().catch();
  }
  async getNotifications(){
    await this.hubConnection?.invoke('invokeGetNotifications'); // top 10 najskorijih neprocitanih notif -> OD SADA SAMO NAJSKORIJE, U NOTIF TAB-U IZBACUJE SAD MALO DRUGACIJE

  }
  async getAllNotifications(){
    await this.hubConnection?.invoke('invokeGetAllNotifications'); // sve notifikacije sortirane prvo po vremenu, pa onda po tome da li su procitane
  }
  read_notifications(notificationIds:number[]){
    this.hubConnection?.invoke("readNotifications", notificationIds);
    this.notifications = this.notifications.filter((notification:any) => !notificationIds.includes(notification.id));
    this.allNotifications = this.allNotifications.filter((notification:any) => !notificationIds.includes(notification.id));
    this.checkForNewNotifications();
  }
  getNotificationType(type:any):string{
    switch(type){
      case 0:
        return "uploaded an attachment";
      case 1:
        return "commented on a task";
      case 2:
        return "You have been assigned to a task";
      case 3:
        return "You have been assigned to a project";
      case 4:
        return "finished their task";
      default:
        return "";
    }
  }
  getNotificationText(notification:any):string{
    switch(notification.type){
      case 0://attachment
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type)+" "+notification.task.taskName;
      case 1://comment
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type)+" "+notification.task.taskName;
      case 2:
        return this.getNotificationType(notification.type)+" "+notification.task.taskName;
      case 3:
        return this.getNotificationType(notification.type)+" "+notification.project.projectName;
      case 4:
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type)+" "+notification.task.taskName;
      default:
        return this.getNotificationType(notification.type)+" "+notification.project.projectName;//pravi jos tipova...

    }
  }
  getNotificationText_small(notification:any):string{
    switch(notification.type){
      case 0://attachment
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type);
      case 1://comment
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type);
      case 2:
        return this.getNotificationType(notification.type);
      case 3:
        return this.getNotificationType(notification.type);
      case 4:
        return notification.sender.firstName+" "+notification.sender.lastName+" "+this.getNotificationType(notification.type);
      default:
        return this.getNotificationType(notification.type);

    }
  }

  async follow_notif(event: MouseEvent, notification: any) {
    this.read_notifications([notification.id]);
    if (notification.task != null) {
      event.stopPropagation();
      await this.router.navigate(['/project/' + notification.task.projectId]);
      setTimeout(()=>{
        this.shared.triggerPopup(event, notification.task.id);
      },500);
    } else if (notification.project != null) {
        await this.router.navigate(['/project/' + notification.project.id]);
    }
  }
  async follow_notif_from_tab(event:MouseEvent,notification:any){//jedina razlika je sto nema stop propagination
    this.read_notifications([notification.id]);
    if (notification.task != null) {
      await this.router.navigate(['/project/' + notification.task.projectId]);
      setTimeout(()=>{
        this.shared.triggerPopup(event, notification.task.id);
      },500);
    } else if (notification.project != null) {
        await this.router.navigate(['/project/' + notification.project.id]);
    }
  }
  getType(type:number){
    switch(type){
      case 0:
        return "Attachment";
      case 1:
        return "Comment";
      case 2:
        return "Task Assignment";
      case 3:
        return "Project Assignment";
      case 4:
        return "Task Completed";
      default:
        return "";
    }
  }
  public checkForNewNotifications() {
    this.newNotifications = this.notifications.some((notification: any) => !notification.read);
  }

  getTimeAgo(dateTime: Date): string {
    const now = new Date();
    const notificationDate = new Date(dateTime);
    const diff = now.getTime() - notificationDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 0) {
      return `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return `${seconds} seconds ago`;
    }
  }

}