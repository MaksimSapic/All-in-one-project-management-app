import { Component, EventEmitter, HostListener, OnInit, Output, TemplateRef} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MyProjectsService } from '../../_services/my-projects.service';
import { Project, ProjectStatus } from '../../Entities/Project';
import { MyTasksService } from '../../_services/my-tasks.service';
import { ProjectTask} from '../../Entities/ProjectTask';
import { NgxSpinnerService } from "ngx-spinner";
import { SelectedUser } from '../../Entities/SelectedUser';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { UpdateProject } from '../../Entities/UpdateProject';
import { ProjectMember, ProjectRole } from '../../Entities/ProjectMember';
import { UploadService } from '../../_services/upload.service';
import { SharedService } from '../../_services/shared.service';
import { NewTask } from '../../Entities/NewTask';
import { TaskAssignee } from '../../Entities/TaskAssignee';
import { ProjectSection } from '../../Entities/ProjectSection';
import { ProjectSectionService } from '../../_services/project-section.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { QuillConfigService } from '../../_services/quill-config.service';
import { ThemeServiceService } from '../../_services/theme-service.service';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
  
})
export class ProjectDetailComponent implements OnInit {
  project: Project | any;
  projectTasks: ProjectTask[] = [];
  viewMode: string = 'table';
  modalRef?: BsModalRef;
  groupedTasks: { [key: string]: any } = {};

  update: UpdateProject = {};
  selectedUsers: SelectedUser[] = [];
  usersOnProject: SelectedUser[] = [];
  addableUsers: SelectedUser[] = [];
  filteredUsers: SelectedUser[] = [];
  userId: number = -1;
  searchTerm: string = "";

  clickedTask: ProjectTask | null = null;
  showPopUp: boolean = false;
  task!: ProjectTask;

  // ovo mi treba za add new task
  newTaskName: string = '';
  newTaskDescription: string = '';
  newTaskStartDate: Date | null = null;
  newTaskEndDate: Date | null = null;
  newTaskStatusId: number | null = null;
  newTaskProjectSectionId: number | null = null;
  currentProjectId: number | null = null;
  users: TaskAssignee[] = [];
  selectedUser: TaskAssignee | undefined;
  availableAssigness: any;
  selectedSection: ProjectSection | undefined;
  filterValue: string | undefined = '';
  @Output() taskAdded = new EventEmitter<boolean>();

  buttonClicked: boolean = false;
  taskNameExists: boolean = false;
  enabledEditorOptions: boolean = false;
  allTasks: any[] = [];

  // za view archived tasks
  archivedTasks: ProjectTask[] = [];

  // za section modal
  projectSections: ProjectSection[] = [];
  filteredSections: ProjectSection[] = [];
  newSectionName: string = '';
  searchSection: string = '';

  today: Date = new Date();
  projectEndDate: Date = new Date();
  projectStartDate: Date = new Date();
  oldProjectName: string = "";
  userRole: ProjectRole | any;

  rangeDates: Date[] | undefined;
  selectedStatus: string = '';
  searchText: string='';

  allStatuses:any[]=[];

  sortedColumn: string = '';
  sortedOrder: number = 0; 

  fetchingTaskId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private myProjectsService: MyProjectsService,
    private myTasksService: MyTasksService,
    private spinner: NgxSpinnerService,
    private modalService: BsModalService,
    public uploadservice: UploadService,
    private shared: SharedService,
    private projectSectionService: ProjectSectionService,
    private router: Router,
    private toastr: ToastrService,
    public quillService: QuillConfigService,
    public themeService: ThemeServiceService
  ) { }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    this.shared.taskStatusChanged.subscribe(() => {
      if(projectId)
        this.myTasksService.GetTaskStatuses(parseInt(projectId)).subscribe((statuses: any[]) => {
          this.allStatuses = statuses;
          this.allStatuses = this.allStatuses.filter(status => status.name !== 'Archived');
        });
    });
    if(projectId)
      this.myTasksService.GetTaskStatuses(parseInt(projectId)).subscribe((statuses: any[]) => {
        this.allStatuses = statuses;
        this.allStatuses = this.allStatuses.filter(status => status.name !== 'Archived');
      });
    const userId = localStorage.getItem("id");
    this.currentProjectId = projectId ? +projectId : null;

    if (projectId && userId) {
      this.getUsersProjectRole(+projectId, +userId);
    }
    this.shared.taskUpdated.subscribe(() => {
      this.getProjectInfo();  
    });
    this.shared.sectionUpdated.subscribe(() => {
      this.getProjectInfo();
    })
    this.route.params.subscribe(params => {
      const projectId = +params['id'];
      this.currentProjectId = projectId;
      this.getProjectInfo();
    });
    this.shared.togglePopup$.subscribe(({ event, taskId }) => {
    this.togglePopUp(event, taskId);
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

  getProjectInfo() {
    this.spinner.show();
    this.userId = localStorage.getItem("id") ? Number(localStorage.getItem("id")) : -1;

    let startDate = '';
    let endDate = '';
    if (this.rangeDates && this.rangeDates.length === 2) {
      const start = new Date(this.rangeDates[0]);
      const end = new Date(this.rangeDates[1]);
      if (this.rangeDates[0]) {
        start.setHours(0, 0, 0, 0);
        startDate = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}T00:00:00`;
      }
      if (this.rangeDates[1]) {
        end.setHours(23, 59, 59, 999);
        endDate = `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}T23:59:59`;
      }
    }

    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.myProjectsService.getProjectById(+projectId).subscribe((project) => {
        this.project = project;
        this.oldProjectName = project.projectName;
        this.projectEndDate = new Date(project.endDate);
        this.projectStartDate= new Date(project.startDate);
        this.myTasksService.GetTasksByProjectId(project.id, this.sortedColumn,this.sortedOrder, this.searchText,this.selectedStatus,startDate,endDate).subscribe((tasks) => {
          this.projectTasks = tasks.filter(task => task.statusName !== 'Archived');
          this.allTasks=this.projectTasks;
          this.archivedTasks = tasks.filter(task => task.statusName === 'Archived');
          this.groupedTasks = this.groupTasksBySection(this.projectTasks);
        });
        this.spinner.hide();
      });
    }
  }

  loadProjectMembers(){
    this.myProjectsService.getUsersByProjectId(this.project.id).subscribe((users: any[]) => {
      this.usersOnProject = users.map<SelectedUser>(user => ({ name: `${user.firstName} ${user.lastName}`, appUserId: user.appUserId, email: user.email, profilePicUrl: user.profilePicUrl,projectRole: +user.projectRole,archived: user.archived}));
      this.filteredUsers = this.usersOnProject;
    });
  }

  loadAddableUsers(){
    this.myProjectsService.GetAddableUsers(this.project.id).subscribe((users: any[]) => {
      this.addableUsers = users.map<SelectedUser>(user => ({ name: `${user.firstName} ${user.lastName}`, appUserId: user.id, email: user.email, profilePicUrl: user.profilePicUrl,projectRole: ProjectRole.Guest}));
    });
  }

  loadAvailableAssigness(){
    this.myProjectsService.getAvailableAssigness(this.project.id).subscribe({
      next: response => {
        this.availableAssigness = response,
        this.availableAssigness.forEach((assigne: any) => {
          assigne.appUserId = assigne.id;
          assigne.fullName = assigne.firstName + ' ' + assigne.lastName;
        });
      },
      error: error => console.log(error)
    });
  }

  groupTasksBySection(tasks: any[]): { [key: string]: any } {
    const grouped = tasks.reduce((acc, task) => {
      const section = task.sectionName || 'No Section';
      if (!acc[section]) {
        acc[section] = { tasks: [], visible: section === 'No Section' };
      }
      acc[section].tasks.push(task);
      return acc;
    }, {});
    if (!grouped['No Section']) {
      grouped['No Section'] = { tasks: [], visible: true };
    }

    return grouped;
  }
  groupTasksBySectionSorted(tasks: any[]): { [key: string]: any } {
    const grouped = tasks.reduce((acc, task) => {
      const section = task.sectionName || 'No Section';
      if (!acc[section]) {
        if(this.sortedOrder==0)
        {
          acc[section] = { tasks: [], visible: section === 'No Section' };
        }
        else
        {
          acc[section] = { tasks: [], visible: section != 'No Section' };
        }
      }
      acc[section].tasks.push(task);
      return acc;
    }, {});
    if (!grouped['No Section']) {
      grouped['No Section'] = { tasks: [], visible: true };
    }

    return grouped;
  }
  groupTasksBySectionFiltered(tasks: any[]): { [key: string]: any } {
    const grouped = tasks.reduce((acc, task) => {
      const section = task.sectionName || 'No Section';
      if (!acc[section]) {
        if(this.searchText=='' && this.selectedStatus=="" &&  this.rangeDates==undefined)
        {
          acc[section] = { tasks: [], visible: section === 'No Section' };
        }
        else
        {
          acc[section] = { tasks: [], visible: section != 'No Section' };
        }
      }
      acc[section].tasks.push(task);
      return acc;
    }, {});
    if (!grouped['No Section']) {
      grouped['No Section'] = { tasks: [], visible: true };
    }

    return grouped;
  }
 

  toggleSectionVisibility(section: string): void {
    this.groupedTasks[section].visible = !this.groupedTasks[section].visible;
  }

  sectionOrder = (a: { key: string }, b: { key: string }) => {
    if (a.key === 'No Section') return -1;
    if (b.key === 'No Section') return 1;
    return a.key.localeCompare(b.key);
  };

  changeToTable() {
    this.getProjectInfo();
    this.viewMode = 'table';
  }
  changeToKanban() {
    this.getProjectInfo();
    this.viewMode = 'kanban';
  }
  changeToGant() {
    this.getProjectInfo();
    this.viewMode = 'gantt';
  }

  openProjectInfo(modal: TemplateRef<void>){
    this.modalRef = this.modalService.show(
      modal,
      {
        class: "modal modal-lg modal-dialog-centered projectInfoModal",
      }
    );
      this.update.projectId = this.project.id;
      this.update.appUserId = this.userId;
      this.update.projectName = this.project.projectName;
      this.update.description = this.project.description;
      this.update.startDate = this.project.startDate;
      this.update.endDate = this.project.endDate;
      this.update.projectStatus = this.project.projectStatus;
      this.enabledEditorOptions = false;
  }

  openMemberManagment(modal: TemplateRef<void>){
    this.loadProjectMembers();
    this.loadAddableUsers();
    this.modalRef = this.modalService.show(
      modal,
      {
        class: "modal modal-md modal-dialog-centered MemberManagmentModel",
      }
    );
  }

  
  resetTimeProjInfo(date: Date | string): Date {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    date.setHours(2, 0, 0, 0);
    return date;
  }

  updateProject()
  { 
    this.spinner.show()
    if(!this.update.projectName || (this.update.projectName && this.update.projectName?.length > 100)){
      this.update.projectName = this.oldProjectName;
      return;
    }
    if(this.update.description && this.update.description?.length > 10000)
    {
      this.toastr.error("Description is too long.");
      return;
    }
    if(this.userRole == 1 || this.userRole == 0)
    {
      if(this.update.projectName !== this.project.projectName || this.update.projectStatus!=this.project.projectStatus ||
        this.update.endDate != this.project.endDate || this.update.description != this.project.description)
      {
        if(this.update.projectStatus!==undefined)
            this.update.projectStatus = +this.update.projectStatus;
        
        if(this.update.endDate)
          this.update.endDate = this.resetTimeProjInfo(this.update.endDate);

        this.myProjectsService.UpdateProject(this.update).subscribe(updatedProject => {
          this.getProjectInfo()
          this.spinner.hide()
        })
      }
    }
  }

  addProjectMembers()
  {
    this.spinner.show()
    if(this.userRole == 1 || this.userRole == 0)
    {
      var projectMembers = this.selectedUsers.map<ProjectMember>(user => ({ AppUserId: user.appUserId, ProjectId: this.project.id, ProjectRole: user.projectRole = +user.projectRole}));

      this.myProjectsService.AddProjectMembers(projectMembers).subscribe(response => {
        this.loadAddableUsers()
        this.loadProjectMembers()
        this.selectedUsers = []
        this.spinner.hide()
      })
    }
  }

  deleteAssigne(userId: number){
    this.spinner.show()
    if(this.userRole == 0 || this.userRole == 1)
    {
      this.myProjectsService.DeleteProjectMember(this.project.id,userId).subscribe(() => {
        this.shared.emitTaskUpdated();
        this.loadProjectMembers()
        this.loadAddableUsers()
        this.searchTerm = ''
        this.spinner.hide()
      })
    }
  }

  updateUsersRole(user: SelectedUser){
    this.spinner.show();
    if(this.userRole == 0 || this.userRole == 1 || this.userRole == 2)
    {
      var projectMember : ProjectMember = {
        AppUserId: user.appUserId,
        ProjectId: this.project.id,
        ProjectRole: +user.projectRole
      }

      this.myProjectsService.UpdateUsersProjectRole(projectMember).subscribe(update => {
        this.spinner.hide()
      })
    }
  }

  filterUsers() {
    if (this.searchTerm.trim() !== '')
    {
      this.filteredUsers = this.usersOnProject.filter(user =>
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    else {
      this.filteredUsers = this.usersOnProject;
    }
  }

  filterSections() {
    if (this.searchSection.trim() !== '')
    {
      this.filteredSections = this.projectSections.filter(section =>
        section.sectionName.toLowerCase().includes(this.searchSection.toLowerCase())
      );
    }
    else {
      this.filteredSections = this.projectSections;
    }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const popUp = document.querySelector('.pop') as HTMLElement;
    const elementRef = document.getElementById('area-desc') as HTMLElement;
    if (popUp && !popUp.contains(event.target as Node) && this.showPopUp) {
      this.showPopUp = false;
      this.clickedTask = null;
      this.shared.current_task_id=null;
    }
    else if (elementRef && !elementRef.contains(event.target as Node)) {
      this.enabledEditorOptions = false;
    }
  }

  getStatusClass(){
    switch (this.update.projectStatus) {
      case ProjectStatus.Archived:
          return "ARCHIVED"
      case ProjectStatus.InProgress:
          return "INPROGRESS"
      case ProjectStatus.Proposed:
          return "PROPOSED"
      case ProjectStatus.Completed:
          return "COMPLETED"
      default:
          return "DEFAULT"
    }
  }

  async saveTask() {
    this.taskNameExists = false;
    this.buttonClicked = true;

    if(!this.newTaskName || this.newTaskName.length>100)
        return;

    if(this.newTaskDescription.length > 5000)
      return;
    
    if(await this.TaskNameExists())
    {
      this.taskNameExists = true;
      return;
    }

    if(!this.newTaskStartDate || !this.newTaskEndDate)
      return;

    // uklanja milisekunde
    this.newTaskStartDate = this.resetTime(this.newTaskStartDate);
    this.newTaskEndDate = this.resetTime(this.newTaskEndDate);


    if(this.isInvalidDate())
    {
      return;
    }

    if(!this.selectedUser)
    {
      return;
    }

    this.buttonClicked = false;
    const task: NewTask = {
      CreatorId: Number(localStorage.getItem('id')), // treba mi da ne bih kreatoru slao da je dodelio sam sebi task
      TaskName: this.newTaskName,
      Description: this.newTaskDescription,
      StartDate: this.newTaskStartDate || new Date(),
      EndDate: this.newTaskEndDate || new Date(),
      ProjectId: this.currentProjectId || 0,
      AppUserId: this.selectedUser?.appUserId || 0,
      ProjectSectionId: this.selectedSection?.id || 0
    };
    this.myTasksService.createTask(task).subscribe({
      next: () => {
        this.modalRef?.hide();
        this.getProjectInfo();
        this.shared.taskAdded(true);
        this.resetNewTaskFields();
      },
      error: (error) => console.error('Error creating task:', error)
    });
  }

  resetNewTaskFields(): void {
    this.newTaskName = '';
    this.newTaskDescription = '';
    this.newTaskStartDate = null;
    this.newTaskEndDate = null;
    this.newTaskStatusId = null;
    this.newTaskProjectSectionId = null;
    this.selectedUser = undefined;
    this.selectedSection = undefined;
  }

  // sklanja milisekunde
  resetTime(date: Date): Date {
    date.setHours(2, 0, 0, 0);
    return date;
  }

  // vraca AppUsers koji su na projektu
  getProjectsUsersAndSections(currentProjectId: number) {
    const noSection = { id: 0, sectionName: 'No Section', projectId:currentProjectId };
    this.myProjectsService.getUsersByProjectId(currentProjectId).subscribe({
      next: response => {
        this.users = response,
        this.users.forEach(user => {
          user.fullName = user.firstName + ' ' + user.lastName;
        });
      },
      error: error => console.log(error)
    });
    this.projectSectionService.getSectionsByProject(currentProjectId)
    .subscribe(sections => {
      this.projectSections = sections;
      this.projectSections.unshift(noSection);
    });

  }

  openNewTaskModal(modal: TemplateRef<void>) {
    this.buttonClicked=false;
    this.loadAvailableAssigness();
    if (this.currentProjectId !== null)
    {
      this.getProjectsUsersAndSections(this.currentProjectId);
    }
    this.modalRef = this.modalService.show(
      modal,
      {
        class: 'modal-md modal-dialog-centered'
      });
  }

  openViewArchTaksModal(modal: TemplateRef<void>) {
    this.modalRef = this.modalService.show(
      modal,
      {
        class: 'modal-lg modal-dialog-centered'
      });
  }

  removeFromArchived() {
    this.spinner.show(); // prikazi spinner
    const selectedTaskIds = this.archivedTasks
      .filter(task => task.selected)
      .map(task => task.id);
    this.myTasksService.UpdateArchTasksToCompleted(selectedTaskIds).subscribe({
      next: () => {
        this.modalRef?.hide();
        this.getProjectInfo();
        this.shared.taskAdded(true);
        this.spinner.hide(); // skloni spinner
      },
      error: (error) => {
        console.error('Error updating tasks status:', error);
        this.spinner.hide(); // skloni spinner cak i ako dodje do greske
      }
    });
  }

  SelectedOwner(user: SelectedUser){
    if(this.selectedUsers.find(x => x.projectRole == 1 && x.appUserId != user.appUserId)){
      if(user.projectRole == 1)
        user.projectRole = 4
      return true
    }
    return false
  }

  OwnerAlreadyExists(userId: number){
    if(this.usersOnProject.find(x => x.projectRole == ProjectRole.ProjectOwner && x.appUserId!=userId))
      return true
    return false
  }

  openSectionModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {
      class: 'modal-md modal-dialog-centered'
    });
    if (this.currentProjectId) {
      this.projectSectionService.getSectionsByProject(this.currentProjectId)
        .subscribe(sections => {
          this.projectSections = sections;
          this.filteredSections = this.projectSections;
        });
    }
  }

  deleteSection(sectionId: number) {
    this.projectSectionService.deleteSection(sectionId).subscribe(() => {
      this.projectSections = this.projectSections.filter(section => Number(section.id) !== sectionId);
      this.filteredSections = this.projectSections;
      this.shared.notifySectionUpdate();
    });
  }

  createNewSection() {
    if (this.newSectionName.trim() && this.currentProjectId !== null) {
      this.projectSectionService.createSection(this.newSectionName, this.currentProjectId).subscribe({
        next: (section) => {
          this.projectSections.push(section);
          this.shared.notifySectionUpdate();
          this.newSectionName = '';
        },
        error: (error) => {
          console.error('Error creating section:', error);
        }
      });
    }
  }
  async TaskNameExists()
  {
    try
    {
      var task = await this.myTasksService.TaskNameExists(this.newTaskName,this.project.id).toPromise();
      return task? true : false;
    }
    catch(error)
    {
      console.error("Error occurred while checking task name", error);
      return;
    }
  }
  isInvalidDate(): boolean {
    if(this.newTaskStartDate && this.newTaskEndDate){
      let startDate = new Date(this.newTaskStartDate);
      let currentDate = new Date();
      startDate.setHours(0,0,0,0);
      currentDate.setHours(0,0,0,0);
      return !(this.newTaskStartDate <= this.newTaskEndDate && (startDate>=currentDate));
    }
    return false;
  }
  showEditOptions(){
    this.enabledEditorOptions = true;
  }

  openArchiveProjectcModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {
      class: 'modal-sm modal-dialog-centered'
    });
  }
  
  openDeleteProjectcModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {
      class: 'modal-sm modal-dialog-centered'
    });
  }

  confirmArchive() {
    if (this.project && this.project.id) {
      this.myProjectsService.archiveProject(this.project.id).subscribe({
        next: () => {
          this.getProjectInfo();
          this.modalRef?.hide();
          this.router.navigate(['/myprojects']).then(() => {
            this.toastr.success('Project has been archived.');
          });
        },
        error: error => {
          this.toastr.error('Failed to archive project');
        }
      });
    }
  }

 toggleSortOrder(column: string): void {
    if (this.sortedColumn === column) {
      this.sortedOrder = (this.sortedOrder + 1) % 3;
    } else {
      this.sortedColumn = column;
      this.sortedOrder = 1;
    }
    this.spinner.show();
    this.userId = localStorage.getItem("id") ? Number(localStorage.getItem("id")) : -1;

    let startDate = '';
    let endDate = '';
    if (this.rangeDates && this.rangeDates.length === 2) {
      const start = new Date(this.rangeDates[0]);
      const end = new Date(this.rangeDates[1]);
      if (this.rangeDates[0]) {
        start.setHours(0, 0, 0, 0);
        startDate = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}T00:00:00`;
      }
      if (this.rangeDates[1]) {
        end.setHours(23, 59, 59, 999);
        endDate = `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}T23:59:59`;
      }
    }

    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.myProjectsService.getProjectById(+projectId).subscribe((project) => {
        this.project = project;
        this.myTasksService.GetTasksByProjectId(project.id, this.sortedColumn,this.sortedOrder,this.searchText,this.selectedStatus,startDate,endDate).subscribe((tasks) => {
          this.projectTasks = tasks.filter(task => task.statusName !== 'Archived');
          this.allTasks=this.projectTasks;
          this.archivedTasks = tasks.filter(task => task.statusName === 'Archived');
          this.groupedTasks = this.groupTasksBySectionSorted(this.projectTasks);
        });
        this.loadProjectMembers();
        this.loadAddableUsers();
        this.spinner.hide();
      });
    }
  }

  getSortClass(column: string): string {
    if (this.sortedColumn === column) {
      if(this.sortedOrder==1)
        return 'sorted-asc';
      if(this.sortedOrder==2)
        return 'sorted-desc';
      else
        return 'unsorted';
    }
    return 'unsorted';
  }

  filterTasks():void{
    let startDate = '';
    let endDate = '';
    if (this.rangeDates && this.rangeDates.length === 2) {
      const start = new Date(this.rangeDates[0]);
      const end = new Date(this.rangeDates[1]);
      if (this.rangeDates[0]) {
        start.setHours(0, 0, 0, 0);
        startDate = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}T00:00:00`;
      }
      if (this.rangeDates[1]) {
        end.setHours(23, 59, 59, 999);
        endDate = `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}T23:59:59`;
      }
    }

    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.myProjectsService.getProjectById(+projectId).subscribe((project) => {
        this.project = project;
        this.myTasksService.GetTasksByProjectId(project.id, this.sortedColumn,this.sortedOrder,this.searchText,this.selectedStatus,startDate,endDate).subscribe((tasks) => {
          this.projectTasks = tasks.filter(task => task.statusName !== 'Archived');
          this.allTasks=this.projectTasks;
          this.archivedTasks = tasks.filter(task => task.statusName === 'Archived');
          this.groupedTasks = this.groupTasksBySectionFiltered(this.projectTasks);
        });
        this.loadProjectMembers();
        this.loadAddableUsers();
        this.spinner.hide();
      });
    }
  }

  showDelete(user: any){
    var flag = false;
    if(this.userId != user.appUserId && this.userRole != 2 && this.userRole != 3 && this.userRole != 4 && user.archived==false)
        flag = true;
    if(user.projectRole == 0 && this.userRole == 1){
        flag = false;
    }
    return flag;
  }

  getDarkerColor(color: string): string {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    let darkeningFactor = 0.5; // promeni shade factor
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
}