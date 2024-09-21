import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CustomToastService } from '../../_services/custom-toast.service';
import { UploadService } from '../../_services/upload.service';
import { NotificationsService } from '../../_services/notifications.service';

@Component({
  selector: 'app-custom-toast',
  templateUrl: './custom-toast.component.html',
  styleUrl: './custom-toast.component.css',
  animations: [
    trigger('openClose', [
      state(
        'closed',
        style({
          visibility: 'hidden',
          right: '-400px',
        })
      ),
      state(
        'open',
        style({
          right: '40px',
        })
      ),
      transition('open <=> closed', [animate('0.5s ease-in-out')]),
    ]),
  ],
})
export class CustomToastComponent{
  @ViewChild('element', { static: false })
  progressBar!: ElementRef;
  progressInterval:any;
  
  constructor(public toastService:CustomToastService,public uploadService:UploadService,public notificationService:NotificationsService) {
    this.toastService.open.subscribe((data:any) => {
      if (data.show) {
        this.countDown();
      }
    });
  }
  countDown() {
    this.progressBar.nativeElement.style.width =
      this.toastService.data.progressWidth;

    this.progressInterval = setInterval(() => {
      const width = parseInt(this.progressBar.nativeElement.style.width, 10);

      if (width <= 0) {
        this.toastService.hide();
        clearInterval(this.progressInterval);
        return;
      }

      this.toastService.data.progressWidth = String(width - 2) ;
      this.progressBar.nativeElement.style.width =
        this.toastService.data.progressWidth + '%';
    }, 100);
  }

  stopCountDown() {
    clearInterval(this.progressInterval);
  }
}