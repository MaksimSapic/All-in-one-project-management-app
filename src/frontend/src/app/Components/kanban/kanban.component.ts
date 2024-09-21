import { Component, OnInit, TemplateRef, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner";
import { MyTasksService } from '../../_services/my-tasks.service';
import { ProjectTask } from '../../Entities/ProjectTask';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TaskAssignee } from '../../Entities/TaskAssignee';
import { MyProjectsService } from '../../_services/my-projects.service';
import { UploadService } from '../../_services/upload.service';
import { SharedService } from '../../_services/shared.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeServiceService } from '../../_services/theme-service.service';
import { TaskStatusDto } from '../../Entities/TaskStatusDto';

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})

export class KanbanComponent implements OnInit{
  tasks: any[] = [];
  taskStatuses: any[] = [];
  tasksBySection: { [key: string]: ProjectTask[] } = {};
  taskStatusNames: string[] = [];
  modalRef?: BsModalRef;
  newSectionName: string = '';
  currentProjectId: number | null = null;
  newSectionColor: string = '#ffffff'; // default boja

  // Section koji ce biti obrisan
  currentSectionName: string = '';
  currentSectionId: number | null = null;
  
  selectedArchivedTasks: any[] = [];

  userId: number = -1;
  userProjectRole: number | null = null;
  clickedTask: ProjectTask | null = null;
  showPopUp: boolean = false;
  task!: ProjectTask;

  users: TaskAssignee[] = [];
  selectedUser: TaskAssignee | undefined;;
  filterValue: string | undefined = '';

  userRole: number | null = null;

  @Output() sectionChanged = new EventEmitter<boolean>();

  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private myTasksService: MyTasksService,
    private modalService: BsModalService,
    private myProjectsService: MyProjectsService,
    public uploadservice: UploadService,
    private shared: SharedService,
    private toastr: ToastrService,
    public themeService: ThemeServiceService
  ) { }

  ngOnInit() {
    const userId = localStorage.getItem("id");
    const projectId = this.route.snapshot.paramMap.get('id');
    this.currentProjectId = projectId ? +projectId : null;
    if (projectId && userId) {
      this.getUsersProjectRole(+projectId, +userId);
    }

    this.spinner.show();
    this.shared.taskUpdated.subscribe(() => {
      this.loadTasksAndUsers();
    });
    this.populateTasks();
    if (this.currentProjectId !== null) {
      this.getProjectsUsers(this.currentProjectId);
    }
    this.spinner.hide();
    this.shared.taskAdded$.subscribe(success => {
      if (success) {
          this.populateTasks();
      }
    });
  }

  loadTasksAndUsers():void{
    this.spinner.show();
    this.populateTasks();
    if (this.currentProjectId !== null) {
      this.getProjectsUsers(this.currentProjectId);
    }
    this.spinner.hide();
  }

  getUsersProjectRole(projectId: number, userId: number) {
    this.myProjectsService.getUserProjectRole(projectId, userId).subscribe({
        next: (role) => {
            this.userRole = role;
        },
        error: (error) => {
            console.error('Failed to fetch user role.', error);
        }
    });
  }

  populateTasks() {
    this.GetTaskStatuses();
    if (this.currentProjectId) {
      this.myTasksService.GetTasksByProjectId(this.currentProjectId).subscribe((tasks) => {
        this.tasks = tasks;
        this.groupTasksByStatus();
        this.userProjectRole = this.tasks.find(x => x)
      });
    }
  }

  GetTaskStatuses() {
    if (this.currentProjectId) {
      this.myTasksService.GetTaskStatuses(this.currentProjectId).subscribe((statuses) => {
        this.taskStatuses = statuses.map(status => ({
          ...status,
          tempStatusName: status.name
        }));
        this.taskStatuses.sort((a, b) => a.position - b.position);
      });
    }
  }

  groupTasksByStatus() {
    this.tasksBySection = this.tasks.reduce((acc, task) => {
      const statusName = task.statusName;
      if (!acc[statusName]) {
        acc[statusName] = [];
      }
      acc[statusName].push(task);
      return acc;
    }, {});
    this.taskStatuses.forEach(status => {
      if (!this.tasksBySection[status.name]) {
        this.tasksBySection[status.name] = [];
      }
    });
  }

  drop(event: CdkDragDrop<ProjectTask[]>) {
    const targetStatus = this.taskStatuses.find(s => s.name === event.container.id);
    if (targetStatus.name === 'Completed' && this.userRole !== 1 && this.userRole !== 0) {
      this.toastr.error('Only Project Owner can move tasks to the Completed board.');
      return;
    }

    // kad nece da prevuce ukoliko se odmah nakon pokretanja servera zabaguje
    // samo prvo prevlacenje nece da radi. sledece hoce
    if (!event.previousContainer.data || !event.container.data) {
      this.populateTasks();
      return;
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
      const task = event.item.data;
      const newStatus = this.taskStatuses.find(s => s.name === event.container.id);
      if (task && newStatus) {
        task.taskStatusId = newStatus.id;
        task.senderid = Number(localStorage.getItem("id"));
        this.myTasksService.updateTicoTaskStatus(task.id, task).subscribe();
      }
    }
  }

  dropColumn(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.taskStatuses, event.previousIndex, event.currentIndex);
    this.updateTaskStatusPositions();
  }

  updateTaskStatusPositions() {
    const updatedStatuses = this.taskStatuses.map((status, index) => ({ ...status, position: index }));
    if(this.currentProjectId)
      this.myTasksService.updateTaskStatusPositions(updatedStatuses, this.currentProjectId).subscribe(() => {
        this.GetTaskStatuses();
      });
  }
  
  openDeleteStatusModal(modal: TemplateRef<void>, sectionName: string = '', sectionId: number) {
    this.currentSectionName = sectionName;
    this.currentSectionId = sectionId;
    this.modalRef = this.modalService.show(
      modal,
      {
        class: 'modal-sm modal-dialog-centered'
      });
  }
  openSimpleModal(modal: TemplateRef<void>, modalSize: string) {
    let modalClass = '';
    if(modalSize === 'newBoard')
      modalClass = 'modal-sm modal-dialog-centered';
    else if (modalSize === 'newTask' || modalSize === 'archivedTasks')
    modalClass = 'modal-lg modal-dialog-centered';
    this.modalRef = this.modalService.show(
      modal,
      {
        class: modalClass
      });
    this.tasksBySection['Archived'].forEach(task => task.selected = false); // resetuj task.selection chekbox u remove arch tasks
  }
  deleteBoardFunction() {
    if (this.currentSectionId === null) {
      console.error('Section ID is null.');
      return;
    }
    this.myTasksService.deleteTaskStatus(this.currentSectionId).subscribe({
      next: () => {
        this.modalRef?.hide();
        this.sectionChanged.emit(true);
        this.shared.notifyTaskStatusChange();
        this.populateTasks();
      },
      error: (error) => console.error('Error deleting section:', error)
    });
  }
  saveNewBoard() {
    if (this.currentProjectId === null) {
      console.error('Project ID is null.');
      return;
    }
    if(!this.newSectionName || this.newSectionName.length > 30)
    {
      this.toastr.error("Status name is too long.");
      return
    }
    const taskStatus = {
      statusName: this.newSectionName,
      projectId: this.currentProjectId,
      color: this.newSectionColor
    };
    this.myTasksService.addTaskStatus(taskStatus).subscribe({
      next: () => {
        this.modalRef?.hide(); // za skrivanje modala
        this.newSectionName = '';
        this.newSectionColor = '#ffffff';
        this.sectionChanged.emit(true);
        this.shared.notifyTaskStatusChange();
        this.populateTasks();
      },
      error: (error) => this.toastr.error(error.error)
    });
  }

  // vraca AppUsers koji su na projektu
  getProjectsUsers(currentProjectId: number) {
    this.myProjectsService.getUsersByProjectId(currentProjectId).subscribe({
      next: response => {
        this.users = response,
        this.users.forEach(user => {
          user.fullName = user.firstName + ' ' + user.lastName;
        });
      },
      error: error => console.log(error)
    });
  }

  onTaskClick(event: MouseEvent, taskId: number) {
    // event.stopPropagation(); 
    this.shared.triggerPopup(event, taskId);
  }

  getDarkerColor(color: string): string {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    let darkeningFactor = 0.5; // ovde je moguce promeniti shade factor
    r = Math.floor(r * darkeningFactor);
    g = Math.floor(g * darkeningFactor);
    b = Math.floor(b * darkeningFactor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  getLessPoppingColor(color: string): string {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
  
    let { h, s, l } = this.rgbToHsl(r, g, b);
  
    s = Math.max(s * 0.5, 0);
    l = Math.max(l * 0.5, 0);
  
    ({ r, g, b } = this.hslToRgb(h, s, l));
    return `rgb(${r}, ${g}, ${b})`;
  }

  getPoppingColor(color: string): string {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
  
    let { h, s, l } = this.rgbToHsl(r, g, b);
  
    s = Math.min(s * 1.5, 100);
    l = Math.min(l * 1.5, 100);
  
    ({ r, g, b } = this.hslToRgb(h, s, l));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
  
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }
  
  hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
  
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  renameTaskStatus(statusId: number, newStatusName: string): void {
    if (newStatusName.length < 1 || newStatusName.length > 30) {
      this.toastr.error("Status name must be between 1 and 30 characters long.");
      return;
    }
    if(statusId && this.currentProjectId){
      var changedTaskStatusDto: TaskStatusDto = {
        Id: statusId,
        StatusName: newStatusName,
        ProjectId: this.currentProjectId
      }
    } else {
      this.toastr.error("Could not detected status that you want to change.");
      return;
    }
    this.myTasksService.renameTaskStatus(changedTaskStatusDto)
      .subscribe({
        next: () => {
          this.populateTasks();
          this.shared.notifyTaskStatusChange();
        },
        error: (error) => {
          console.error('Error updating status name.', error);
          this.toastr.error(error);
        }
      });
  }
}