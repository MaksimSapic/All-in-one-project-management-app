import { TaskDependency } from './../../Entities/TaskDependency';
import { MyProjectsService } from './../../_services/my-projects.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GanttDragEvent, GanttItem, GanttSelectedEvent, GanttView, GanttViewType, NgxGanttComponent, GanttGroup, GanttLink } from '@worktile/gantt';
import { NgxSpinnerService } from 'ngx-spinner';
import { MyTasksService } from '../../_services/my-tasks.service';
import { SharedService } from '../../_services/shared.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.css'
})
export class GanttComponent implements OnInit{
  removeModalRef?:BsModalRef;
  currentProjectId: number | null = null;
  userRole: number | null = null;

  views = [{ name: 'Week', value: GanttViewType.day },{ name: 'Month',value: GanttViewType.month }, { name: 'Year', value: GanttViewType.quarter }];
  viewOptions = {
    dateFormat: {
      year: `yyyy`,
      yearQuarter: `QQQ 'of' yyyy`,
      yearMonth: `LLLL yyyy' (week' w ')'`,
      month: 'LLLL',
      week : 'ww'
    }
  };

  @ViewChild('gantt') ganttComponent!: NgxGanttComponent;
  viewType: GanttViewType = GanttViewType.month;
  selectedViewType: GanttViewType = GanttViewType.month;
  isBaselineChecked = false;
  isShowToolbarChecked = true;
  loading = false; // poprilicno sam siguran da nicemu ne sluzi
  data_loaded = false;
  toolbarOptions = {
    viewTypes: [GanttViewType.day, GanttViewType.week, GanttViewType.month]
  };

  items: GanttItem[] = [];
  groups: GanttGroup[] = [];

  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;


  constructor(
    private route:ActivatedRoute,
    private spinner:NgxSpinnerService,
    private myTasksService:MyTasksService,
    private myProjectsService:MyProjectsService,
    private shared:SharedService,
    private modalService:BsModalService,
    private toastr: ToastrService,
    ) { }

  ngOnInit(): void {
    const userId = localStorage.getItem("id");
    const projectId = this.route.snapshot.paramMap.get('id');  
    this.currentProjectId = projectId ? +projectId : null;
    if (projectId) {
      this.myProjectsService.getProjectById(+projectId).subscribe(project => {
        this.projectStartDate = new Date(project.startDate);
        this.projectEndDate = new Date(project.endDate);
      });
    if(userId)
      this.getUsersProjectRole(+projectId, +userId);
    }

    this.spinner.show();
    this.loading = true;
    this.items=[];
    this.groups=[];
    this.getGanttData(); // kupimo sve podatke za trenutni projekat
    this.spinner.hide();
    setTimeout(()=>
    {
      this.loading = false;
      this.data_loaded = true
    }, 300);

    this.shared.taskUpdated.subscribe(() => {
      this.loading = true;
      this.data_loaded = false;
      this.items=[]; // ako ne stavim prazan niz nece znati da mora opet da ga pokupi
      this.groups=[]; // ako se napravi emit koji samo izbacuje iz array na frontu dosta ce se ubrzati
      this.getGanttData(); // kupimo sve podatke za trenutni projekat
      setTimeout(()=>
        {
        this.loading = false;
        this.data_loaded = true
      }, 300);
    });

    // emit kad se doda novi task
    this.shared.taskAdded$.subscribe(success => {
      if (success) {
        this.loading = true;
        this.data_loaded = false;
        this.items=[];
        this.groups=[];
        this.getGanttData();
        setTimeout(()=>
        {
          this.loading = false;
          this.data_loaded = true
        }, 300);
      }
    });

    // emit za novu sekciju
    this.shared.sectionUpdated.subscribe(() => {
      this.loading = true;
      this.data_loaded = false;
      this.items=[];
      this.groups=[];
      this.getGanttData();
      setTimeout(()=>
      {
        this.loading = false;
        this.data_loaded = true
      }, 300);
    });
  }

  getUsersProjectRole(projectId: number, userId: number) {
    this.myProjectsService.getUserProjectRole(projectId, userId).subscribe({
        next: (role) => {
            this.userRole = role;
        },
        error: (error) => {
            console.error('Failed to fetch user role', error);
        }
    });
  }

  goToToday() {
    this.ganttComponent.scrollToToday();
  }
  ElementwasDragged: boolean = false;
  dragEnded($event: GanttDragEvent) {
    if (this.userRole !== 4 && this.userRole !== 3) {
      if ($event?.item.start !== undefined && $event.item.end !== undefined) {
        const startdate: Date = new Date(this.convertToStandardTimeStamp($event.item.start));
        const enddate: Date = new Date(this.convertToStandardTimeStamp($event.item.end));
        if(this.projectStartDate && this.projectEndDate) {
          if (startdate >= this.projectStartDate && enddate <= this.projectEndDate) {

            this.myTasksService.UpdateTimeGantt(Number($event.item.id), startdate, enddate)
            .subscribe(() => {
              this.data_loaded = true
            });
          } else {
            this.toastr.error("Tasks must be within the project's date range.");
            $event.item.start = Number(this.initialState.start);
            $event.item.end = Number(this.initialState.end);
            this.items = [...this.items];
          }
        }
      }
    } else return
    this.ElementwasDragged = true;
    setTimeout(() => { this.ElementwasDragged = false; }, 200);
  }
  initialState:any = null;
  initialstart:number = 0;
  initialend:number = 0;

  startdrag($event:GanttDragEvent) {
    this.initialState = $event.item;
    this.initialState = JSON.parse(JSON.stringify($event.item));
  }

  dragMoved(event: any) {}

  linkDragEnded(event: any){
    let taskDependency: TaskDependency = {
        taskId: Number(event.target.id),
        dependencyTaskId: Number(event.source.id)
    }
    let arr: TaskDependency[] = [taskDependency];
    this.myTasksService.addTaskDependencies(arr).subscribe((response)=>{});
  } 

  selectView(type: GanttViewType) {
    this.viewType = type;
    this.selectedViewType = type;
  }

  viewChange(event: GanttView) { //promena prikaza
      this.selectedViewType = event.viewType;
  }

  selectedChange(event: GanttSelectedEvent) {
    event.current && this.ganttComponent.scrollToDate(Number(event.current?.start));
  }

  dependency:TaskDependency = {
     taskId:0,
     dependencyTaskId:0
  };
  lineClick(event: any,modal:TemplateRef<void>):void{
    this.openAddTaskToLinkDialog(event.source.id,event.target.id,modal);
  }

  openAddTaskToLinkDialog(first_task : number,second_task : number,modal:TemplateRef<void>): void {
    if (this.userRole === 3 || this.userRole === 4) {
      return;
    }
    this.dependency.taskId = Number(first_task);
    this.dependency.dependencyTaskId = Number(second_task);
    this.removeModalRef = this.modalService.show(
      modal,
      {
        class:'modal-face modal-sm modal-dialog-centered',
      }
    )
  }

  barClick(event: any) {}

  getGanttData(){
    const projectId = this.route.snapshot.paramMap.get('id');
    this.currentProjectId = projectId? +projectId:null;
    this.getProjectSections();
    this.getProjectTasks();
  }
  getProjectSections(){
    if(this.currentProjectId){
      this.myProjectsService.GetProjectSections(this.currentProjectId).subscribe((sections)=>{
        sections.forEach((section:any)=>{
          let group: GanttGroup = {
            id: String(section.id),
            title: section.sectionName
          };
          this.groups.push(group);
        })
      })
    }
    // default sekcija, ukoliko nema svoju
    this.groups.push({ id: 'no-section', title: 'No Section' });
  }
  getProjectTasks(){
    if(this.currentProjectId){
      this.myTasksService.GetTasksByProjectId(this.currentProjectId).subscribe((tasks) =>{
        tasks.forEach((t:any) =>{
          if (t.statusName !== 'Archived') {
            var dependencies:GanttLink[] = [];
            this.myTasksService.GetTaskDependencies(t.id).subscribe((depencency_array:TaskDependency[])=>{
              depencency_array.forEach((dep:TaskDependency) => {
                dependencies.push({
                  type: 4,
                  link: String(dep.dependencyTaskId),
                },
              );
              });
            })
            let item:GanttItem={
              id: String(t.id),
              group_id :t.projectSectionId? String(t.projectSectionId):'no-section',
              title:t.taskName,
              start: this.convertToUnixTimestamp(t.startDate),
              end: this.convertToUnixTimestamp(t.endDate),
              links: dependencies,
              expandable: false,
              linkable: false // link-ovanje elemenata na ganttu iskljuceno
            }
            this.items.push(item);
          }
        })
      })
    }
  }
  removeDependencyGantt(){
    if(this.dependency.dependencyTaskId!=0 && this.dependency.taskId!=0){
      this.myTasksService.deleteTaskDependency(this.dependency)
      .subscribe((response:any)=>{
        const index = this.items.findIndex(item => item.id === String(this.dependency.taskId));
        const linkIndex = this.items[index].links?.findIndex(link => link.link === String(this.dependency.dependencyTaskId));
        if (linkIndex !== -1 && linkIndex!=undefined) {
          this.items[index].links?.splice(linkIndex, 1);
        }
        this.items = [...this.items];
        this.dependency = {
          taskId: 0,
          dependencyTaskId: 0
        }
        this.removeModalRef?.hide();
      });
    }
  }

  convertToUnixTimestamp(dateString: string): number {
    const date = new Date(dateString);
    return date.getTime() / 1000;
  }
  convertToStandardTimeStamp(unixTime:number) : string{
    const date = new Date(unixTime*1000);
    return date.toDateString();
  }

  onTaskClick(event: MouseEvent, taskId: number) {
    if(!this.ElementwasDragged){
      if (this.shared.current_task_id != taskId) {
        this.shared.triggerPopup(event, taskId);
      } else {
        this.shared.current_task_id = null;
      }
    }
  }
}