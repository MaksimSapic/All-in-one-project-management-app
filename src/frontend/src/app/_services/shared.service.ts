import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  current_task_id:any = null;

  private togglePopupSource = new Subject<{ event: MouseEvent, taskId: number }>();
  togglePopup$ = this.togglePopupSource.asObservable();
  taskUpdated: EventEmitter<void> = new EventEmitter();
  public taskStatusChanged: EventEmitter<void> = new EventEmitter();

  constructor() {}
  
  triggerPopup(event: MouseEvent, taskId: number) {
    this.togglePopupSource.next({ event, taskId });
  }
  emitTaskUpdated() {
    this.taskUpdated.emit();
  }

  // emit za novi task
  private taskAddedSource = new Subject<boolean>();
  taskAdded$ = this.taskAddedSource.asObservable();
  taskAdded(success: boolean) {
    this.taskAddedSource.next(success);
  }

  notifyTaskStatusChange(): void {
    this.taskStatusChanged.emit();
  }

  // emit za novu sekciju
  sectionUpdated = new EventEmitter<void>();
  notifySectionUpdate() {
    this.sectionUpdated.emit();
  }
  
}