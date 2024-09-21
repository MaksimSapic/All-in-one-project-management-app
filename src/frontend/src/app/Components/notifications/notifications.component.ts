import { Component, OnInit, TemplateRef } from '@angular/core';
import { NotificationsService } from '../../_services/notifications.service';
import { BsModalRef,BsModalService } from 'ngx-bootstrap/modal';
import { UploadService } from '../../_services/upload.service';
import { SharedService } from '../../_services/shared.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  public notification_list:any = [];
  notifications:any[] = [];
  notifications_read:any[] = [];
  markedNotifications: any[] = [];
  modalref?:BsModalRef;
  constructor (
    public notificationService:NotificationsService,
    private modalService:BsModalService,
    public uploadService:UploadService,
    private shared:SharedService
  ){}
  async getNotifications(){
    await this.notificationService.getNotifications(); // ovde smanjim da uzima manje notifikacija, tipa da uzme 10 najskorijih neprocitanih notifikacija
    this.notification_list = this.notificationService.notifications;
    this.notificationService.notifications.forEach((n:any) => {
      n.timeAgo = this.notificationService.getTimeAgo(n.dateTime);
    });
  }
  see_all_notifications(modal:TemplateRef<void>){
    this.handleNotificationDisplay();
    this.modalref = this.modalService.show(
      modal,
      {
        class:'modal-fade modal-lg modal-dialog-centered w-500',
      }
    )
  }
  async handleNotificationDisplay(){
    await this.notificationService.getAllNotifications();
    this.notifications = [];
    this.notifications_read = []; // refresh
    this.notificationService.allNotifications.forEach((n:any) => {
      if(n.read == false){
        this.notifications.push(n); // lista neprocitanih
      }else{
        this.notifications_read.push(n); // lista procitanih
      }
    });
  }
  selectAllNotifications() {
    if (this.areAllNotificationsSelected()) {
      this.markedNotifications = [];
    } else {
      this.markedNotifications = this.notifications.map((notification:any) => notification.id);
    }
  }
  readAllFromTab($event:MouseEvent){
    $event.stopPropagation();
    this.notification_list.forEach((element:any) => {
      element.read = true;
    });
    this.markedNotifications = this.notification_list.map((notification:any) => notification.id);
    this.read_notifications();
  }

  areAllNotificationsSelected(): boolean {
    return this.notifications && this.markedNotifications.length === this.notifications.length;
  }

  toList(notificationId: any) {
    if (this.markedNotifications.includes(notificationId)) {
      this.markedNotifications = this.markedNotifications.filter(id => id !== notificationId);
    } else {
      this.markedNotifications.push(notificationId);
    }
  }
  read_notifications(){
    this.notificationService.read_notifications(this.markedNotifications);
    this.handleNotificationDisplay();
    this.markedNotifications = [];
  }

  getNotificationType(type:any):string{
    return this.notificationService.getNotificationType(type);
  }

  getNotificationTimeAgo(notification: any): string {
    return this.notificationService.getTimeAgo(notification.dateTime);
  }

}