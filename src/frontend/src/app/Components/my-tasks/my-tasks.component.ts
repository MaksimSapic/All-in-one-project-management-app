import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ProjectTask } from '../../Entities/ProjectTask';
import { MyTasksService } from '../../_services/my-tasks.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedService } from '../../_services/shared.service';
import { Project } from '../../Entities/Project';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css'],
  providers: [DatePipe], 
})

export class MyTasksComponent implements OnInit {
  [x: string]: any;
  new_tasks: ProjectTask[] = [];
  soon_tasks: ProjectTask[] = [];
  closed_tasks: ProjectTask[] = [];
  clickedTask: ProjectTask | null = null;
  showPopUp: boolean = false;
  task!: ProjectTask;
  TaskStatus: any;
  static showPopUp: boolean;
  userId=localStorage.getItem('id');
  sortedColumn1: string = '';
  sortedOrder1: number = 0; 
  sortedColumn2: string = '';
  sortedOrder2: number = 0; 
  sortedColumn3: string = '';
  sortedOrder3: number = 0; 

  pageSize1: number = 5;
  pageSize2: number = 5;
  pageSize3: number = 5;

  fetchingTaskId: number | null = null;

  constructor(
    private myTasksService: MyTasksService,
    private spinner: NgxSpinnerService,
    private shared: SharedService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sharedService:SharedService
  ) {}

  ngOnInit(): void {
    this.sharedService.taskUpdated.subscribe(() => {
      this.loadTasks();  
    });
    this.loadTasks();

  }

  togglePopUp(event: MouseEvent, taskId: number): void {
    if (this.clickedTask && this.clickedTask.id === taskId && this.showPopUp) {
      this.closePopup();
    } else {
      this.showPopUp = false;
      this.fetchingTaskId = taskId; 
      this.myTasksService.GetProjectTask(taskId, this.userId).subscribe((task: ProjectTask) => {
        if (this.fetchingTaskId === taskId) { 
          this.clickedTask = task;
          this.showPopUp = true;
          this.shared.current_task_id = this.clickedTask.id;
          this.fetchingTaskId = null; 
        }
      });
    }
  }
  
  closePopup() {
    this.clickedTask = null;
    this.showPopUp = false;
    this.shared.current_task_id = null;
  }


  loadTasks(): void {
    this.spinner.show();

    if (this.userId !== null) {
    this.myTasksService
      .GetNewTasksByUserId(this.userId,this.pageSize1, this.sortedColumn1,this.sortedOrder1)
      .subscribe((tasks: ProjectTask[]) => {
        this.new_tasks = tasks;
        this.spinner.hide();
      });
    this.myTasksService
      .GetSoonTasksByUserId(this.userId,this.pageSize2, this.sortedColumn2,this.sortedOrder2)
      .subscribe((tasks: ProjectTask[]) => {
        this.soon_tasks = tasks;
        this.spinner.hide();
      });
    this.myTasksService
      .GetClosedTasksByUserId(this.userId,this.pageSize3,this.sortedColumn3,this.sortedOrder3)
      .subscribe((tasks: ProjectTask[]) => {
        this.closed_tasks = tasks;
        this.spinner.hide();
      });
    } else {
      console.error('User ID is null');
      this.spinner.hide();
    }
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const popUp = document.querySelector('.pop') as HTMLElement;
    if (popUp && !popUp.contains(event.target as Node) && this.showPopUp) {
      this.showPopUp = false;
      this.clickedTask = null;
    }
  }

  isNewTasksEmpty(): boolean {
    return this.new_tasks.length === 0;
  }
  isSoonTasksEmpty(): boolean {
    return this.soon_tasks.length === 0;
  }
  isClosedTasksEmpty(): boolean {
    return this.closed_tasks.length === 0;
  }

  LoadNewTasks():void{
    this.spinner.show();

    if (this.userId !== null) {
    this.myTasksService
      .GetNewTasksByUserId(this.userId,this.pageSize1,this.sortedColumn1,this.sortedOrder1)
      .subscribe((tasks: ProjectTask[]) => {
        this.new_tasks = tasks;
        this.spinner.hide();
      });
    }
  }
  LoadSoonTasks():void{
    this.spinner.show();

    if (this.userId !== null) {
      this.myTasksService
      .GetSoonTasksByUserId(this.userId,this.pageSize2, this.sortedColumn2,this.sortedOrder2)
      .subscribe((tasks: ProjectTask[]) => {
        this.soon_tasks = tasks;
        this.spinner.hide();
      });
    }
  }
  LoadClosedTasks():void{
    this.spinner.show();

    if (this.userId !== null) {
      this.myTasksService
      .GetClosedTasksByUserId(this.userId,this.pageSize3,this.sortedColumn3,this.sortedOrder3)
      .subscribe((tasks: ProjectTask[]) => {
        this.closed_tasks = tasks;
        this.spinner.hide();
      });
    }
  }

  // ukoliko zatreba za otklanjanje milisekundi
  resetTime(date: Date): Date {
    date.setHours(2, 0, 0, 0);
    return date;
  }

  isOverdue(endDate: Date): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDateReset = new Date(endDate);
    endDateReset.setHours(0, 0, 0, 0);
    return endDateReset < now;
  }

  
  goToProject(project: Project): void {
    this.router.navigate(['/project', project.id]);
  }

  openTaskPopup(taskId: number): void {
    this.myTasksService.GetProjectTask(taskId, this.userId)
      .subscribe((task: ProjectTask) => {
        this.clickedTask = task;
        this.showPopUp = true;
      });
  }

  toggleSortOrder1(column: string): void {
    if (this.sortedColumn1 === column) {
      this.sortedOrder1 = (this.sortedOrder1 + 1) % 3;
    } else {
      this.sortedColumn1 = column;
      this.sortedOrder1 = 1;
    }
    this.LoadNewTasks();
  }
  toggleSortOrder2(column: string): void {
    if (this.sortedColumn2 === column) {
      this.sortedOrder2 = (this.sortedOrder2 + 1) % 3;
    } else {
      this.sortedColumn2 = column;
      this.sortedOrder2 = 1;
    }
    this.LoadSoonTasks();
  }
  toggleSortOrder3(column: string): void {
    if (this.sortedColumn3 === column) {
      this.sortedOrder3 = (this.sortedOrder3 + 1) % 3;
    } else {
      this.sortedColumn3 = column;
      this.sortedOrder3 = 1;
    }
    this.LoadClosedTasks();
  }

  changePageSize1(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value !== '') {
      const pageSize = Number(target.value);
      this.pageSize1 = pageSize;
      this.LoadNewTasks();
    }
  }
  changePageSize2(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value !== '') {
      const pageSize = Number(target.value);
      this.pageSize2 = pageSize;
      this.LoadSoonTasks();
    }
  }
  changePageSize3(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value !== '') {
      const pageSize = Number(target.value);
      this.pageSize3 = pageSize;
      this.LoadClosedTasks();
    }
  }

  getSortClass1(column: string): string {
    if (this.sortedColumn1 === column) {
      if(this.sortedOrder1==1)
        return 'sorted-asc';
      if(this.sortedOrder1==2)
        return 'sorted-desc';
      else
        return 'unsorted';
    }
    return 'unsorted';
  }

  getSortClass2(column: string): string {
    if (this.sortedColumn2 === column) {
      if(this.sortedOrder2==1)
        return 'sorted-asc';
      if(this.sortedOrder2==2)
        return 'sorted-desc';
      else
        return 'unsorted';
    }
    return 'unsorted';
  }

  getSortClass3(column: string): string {
    if (this.sortedColumn3 === column) {
      if(this.sortedOrder3==1)
        return 'sorted-asc';
      if(this.sortedOrder3==2)
        return 'sorted-desc';
      else
        return 'unsorted';
    }
    return 'unsorted';
  }
  
}