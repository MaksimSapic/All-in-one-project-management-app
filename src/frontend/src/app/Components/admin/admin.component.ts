import { Component, HostListener, OnInit, TemplateRef } from '@angular/core';
import { AdminService } from '../../_services/admin.service';
import { RegisterInvitation } from '../../Entities/RegisterInvitation';
import { Member, UserRole } from '../../Entities/Member';
import { ChangeRole } from '../../Entities/ChangeRole';
import { UpdateUser } from '../../Entities/UpdateUser';
import { ToastrService } from 'ngx-toastr';
import { UploadService } from '../../_services/upload.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Project } from '../../Entities/Project';
import { SelectedUser } from '../../Entities/SelectedUser';
import { ProjectMember, ProjectRole } from '../../Entities/ProjectMember';
import { ThemeServiceService } from '../../_services/theme-service.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  template: `
    <button (click)="refreshPage()">Refresh Page</button>
    <i class="fa fa-refresh" (click)="refreshPage()"></i>
  `,
})
export class AdminComponent implements OnInit{

  constructor(
    private adminService: AdminService, 
    private toastr: ToastrService, 
    public uploadservice:UploadService, 
    private spinner:NgxSpinnerService,
    private modalService:BsModalService,
    public themeService: ThemeServiceService
  ){}

  ngOnInit(): void {
   this.onLoad();
   this.numbersOfRoles();
  }

  invitation:RegisterInvitation={
    receiver:''
  }

  allUsers: Member[]=[]
  admins: Member[]=[]
  members: Member[]=[]
  projectMangers: Member[]=[]

  numOfAdmins: number=0
  numOfMembers: number=0;
  numOfPM: number=0;

  userRole: string='';

  changeRole: ChangeRole={
    Id:0,
    Role: 0
  }

  numberOfRoles!: number

  updateUser: UpdateUser={
    FirstName: '',
    LastName: '',
    Email: ''
  }
  newFisrtName: string='';
  newLastName: string='';
  newEmail: string='';

  selectedRolee: string=''

  sortOrder: string = '';

  pageNumber: number = 1;
  pageSize: number = 5;
  totalPages: number=0;
  currentPage: number=1;
  totalusersArray: number[] = [];

  userCount: number=0;
  filteredUsers: number=0;
  allUsersCount: number=0;

  searchTerm: string='';

  modalRef?: BsModalRef;

  curentUserId: number=0
  curentEmail: string=''
  curentName: string=''
  currentLastName: string=''
  currentRole: string=''
  currentId=localStorage.getItem('id');
  selectedUserRole: UserRole | null = null;

  pmCounter: number = 0;
  pmProjects: Project[] = [];
  pmProjectCount: number = 0;
  projectManagers: SelectedUser[] = [];
  selectedManagers: SelectedUser[] = [];

  isFilterActive: boolean=true;
  isFilter1: number=0;

  archived_users: Member[]=[];

  filterRole: string|null=null;

  archivedIds:number[]=[];
  archId: boolean=false;
  invalidEmail: boolean=false;
  regex: RegExp = /^[A-Za-zĀ-ž]{2,30}$/;
  regexEmail: RegExp =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  archMembers: { [key: string]: Member[] } = {};

  sortedColumn: string = '';
  sortedOrder: number = 0; 

  getSortClass(): string {
    if (this.sortedOrder == 1)
      return 'sorted-asc';
    if (this.sortedOrder == 2)
      return 'sorted-desc';
    return 'unsorted';
  }

  Invite(): void{
    if(this.regexEmail.test(this.invitation.receiver))
    {
      this.spinner.show();
      this.adminService.sendInvatation(this.invitation).subscribe(
        (response)=>{
          this.toastr.success(response.message);
          this.spinner.hide();
        }
      )
    }
    else{
      this.toastr.error("Email is not valid");
    }
  }

  GetUserRole(role: UserRole): string{
      switch(role){
        case UserRole.Admin:
          return "Admin"
        case UserRole.Member:
          return "Member"
        case UserRole.ProjectManager:
          return "Project Manager"
        default:
          return ''
      }
  }

  ChangeUserRole(id:number): void{
    this.changeRole.Id=id;
    const ChangeDto={
      Id:id,
      Role: parseInt(this.userRole)
    }
    if(ChangeDto)
    {
      this.adminService.changeUserRole(ChangeDto).subscribe(
        {
          next:() => {
          this.GetUsers()
          this.numbersOfRoles();
      },
      error: (error)=>{
      }}
      )
    }
    }

  UpdateUser(id: number): void{
    
    if (this.newEmail==this.updateUser.Email && this.newFisrtName==this.updateUser.FirstName && this.newLastName == this.updateUser.LastName) {
      this.modalRef?.hide();
      return;
    }

    if(!this.regex.test(this.newFisrtName) || !this.regex.test(this.newLastName) || !this.regexEmail.test(this.newEmail)){
      return;
    }

    this.updateUser.Email = this.newEmail;
    this.updateUser.FirstName = this.newFisrtName;
    this.updateUser.LastName = this.newLastName;
    
    this.adminService.updateUser(id,this.updateUser).subscribe({
      next:()=>{
        this.GetUsers();
        this.modalRef?.hide();
      },
      error: (error) => {}
  })
    
  }

  ArchiveUser(id:number): void{
    this.adminService.archiveUser(id).subscribe(
      (response)=>{
        if(this.currentPage>1 && this.totalPages==1)
          {
            this.currentPage=1;
          }
        this.GetUsers()        

      }
    )

  }
  sortUsersByName(): void {
    if(this.sortOrder==='asc')
    {
    this.allUsers.sort((a, b) => {
      const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      if (fullNameA < fullNameB) return -1;
      if (fullNameA > fullNameB) return 1;
      return 0;
    });
    this.sortOrder = 'desc';
  }
  else{
    this.allUsers.sort((a, b) => {
      const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      if (fullNameA < fullNameB) return 1;
      if (fullNameA > fullNameB) return -1;
      return 0;
    });
    this.sortOrder = 'asc';
  }
  }

  GetUsers(): void {
    this.adminService.getAllUsers1(this.currentPage, this.pageSize,this.selectedRolee, this.searchTerm,this.sortedColumn,this.sortedOrder).subscribe(response => {
      this.allUsers = response;
      
      this.adminService.getCount(this.selectedRolee, this.searchTerm,this.sortedColumn,this.sortedOrder).subscribe({next:(res)=>{
        this.filteredUsers=res;
        this.totalPages= Math.ceil(res / this.pageSize);
        if(this.currentPage>1 && this.totalPages==1)
          {
            this.currentPage=1;
            this.GetUsers();
            return;
          }
        this.totalusersArray= Array.from({ length: this.totalPages }, (_, index) => index + 1);
      
      }})

      this.spinner.hide();
    });
    this.getArchivedUsers();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    this.GetUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    this.GetUsers();
    }
  }
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
    this.GetUsers();
    }
  }

  filterUsers():void{
    this.currentPage=1;
    this.GetUsers();
  }

  onLoad(): void{
    this.adminService.getAllUsers2().subscribe(response=>{
      this.allUsersCount=response;
    })
    this.adminService.getAllUsers1(this.currentPage, this.pageSize,this.selectedRolee, this.searchTerm,this.sortedColumn,this.sortedOrder).subscribe(response => {
      this.allUsers = response;
      this.filteredUsers=this.allUsersCount;
      this.totalPages= Math.ceil(this.allUsersCount / this.pageSize);
      this.totalusersArray= Array.from({ length: this.totalPages }, (_, index) => index + 1);
      this.spinner.hide();
    });
  }

  numbersOfRoles():void{
    this.adminService.getFilterCount().subscribe(res=>{
      this.numOfAdmins=res.adminCount;
      this.numOfMembers = res.memberCount;
      this.numOfPM = res.projectManagerCount;
      this.admins=res.admins;
      this.members=res.members;
      this.projectMangers=res.pManagers;
    })
  }

  assignProjectManagers(){
    var projectMembers = this.pmProjects.map<ProjectMember>((project,i) => 
      ({AppUserId: this.selectedManagers[i].appUserId, ProjectId: project.id , ProjectRole: ProjectRole.ProjectManager}))
    this.adminService.assignProjectManagers(projectMembers).subscribe(response => {});
  }

  demoteProjectManager(){
    this.adminService.demoteProjectManager(this.curentUserId).subscribe({
      next: response => {
        this.assignProjectManagers();
        this.onLoad();
      }
    })
  }

  checkAssignementCompletition(){
    var count = this.selectedManagers.filter((x:any) => x != null).length;
    if(count == this.pmProjectCount)
      return true;
    return false;
  }

  async loadPMInfo(user: Member){
    try
    {
      this.pmCounter = this.allUsers.filter((x:any) => x.role === 2).length
      this.pmProjects = await this.adminService.getManagersProjects(user.id).toPromise();
      this.pmProjectCount = this.pmProjects.length;
      this.projectManagers = await this.adminService.getManagers(user.id).toPromise();
    }
    catch(error){}
  }

  openUserEditModal(modal: TemplateRef<void>, user:Member)
  {
    this.newEmail = user.email;
    this.newFisrtName = user.firstName;
    this.newLastName = user.lastName;
    this.curentUserId=user.id;

    this.modalRef = this.modalService.show(
      modal,
      {
        class: 'modal-sm modal-dialog-centered'
      });
  }

  async openRoleArchModal(modal: TemplateRef<void>, user:Member)
  {
    this.selectedUserRole = user.role;
    this.curentUserId=user.id;
    this.selectedManagers = [];

    this.userRole = user.role.toString();
    this.currentRole=this.GetUserRole(user.role)

    if(user.role==0)
    {
      this.currentRole="Admin";
    }
    else if(user.role==1)
    {
      this.currentRole="Member"
    }
    else if(user.role==2)
    {
      await this.loadPMInfo(user);
      this.currentRole="Project Manager"
    }
    
    if(user.role != 2 || (user.role == 2 && this.pmProjectCount == 0 || this.pmCounter==1)){
      this.modalRef = this.modalService.show(
        modal,
        {
          class: 'modal-sm modal-dialog-centered'
        });
    }
    else{
      this.modalRef = this.modalService.show(
        modal,
        {
          class: 'modal-lg modal-dialog-centered'
        });
    }
  }

  openModal1(modal: TemplateRef<void>){
    this.getArchivedUsers();
    this.modalRef = this.modalService.show(
      modal,
      {
        class: 'modal-lg modal-dialog-centered'
      });
  }

  noFilter():void
  {
    this.selectedRolee='';
    this.filterRole=null;
    this.onLoad();
  }

  currentUser(id:number):boolean{
    return this.admins.some(admin => admin.id === id);
  }

  toogleFilter(role: string): void{
    if(this.filterRole===role)
    {
      this.noFilter();
    }
    else{
      this.filterRole=role;
      this.filterUsers();
    }
  }

  getArchivedUsers(): void{
    this.adminService.getArchivedUsers().subscribe({next:(res)=>{
      this.archived_users=res;
    },error:(error)=>{}
  })

  }

  putInArray(id:number): void{
    this.archivedIds.push(id);
  }

  removeFromArchived() : void{
    if(this.archivedIds!=null)
    {
      this.adminService.removeFromArchieve(this.archivedIds).subscribe({
        next:()=>{
          this.onLoad();
          this.getArchivedUsers();
        }
      })
    }
    else{
      this.toastr.error("There are no selected users.");
    }
  }

  isFocused: boolean = false;

  toggleFocus(): void {
    this.isFocused = !this.isFocused;
  }

  getDisplayedPages(): number[] {
    const maxDisplayedPages = 5;
    let startPage = Math.max(this.currentPage - Math.floor(maxDisplayedPages / 2), 1);
    let endPage = Math.min(startPage + maxDisplayedPages - 1, this.totalPages);

    if (startPage > this.totalPages - maxDisplayedPages + 1) {
        startPage = Math.max(this.totalPages - maxDisplayedPages + 1, 1);
        endPage = this.totalPages;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

 @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.clickable-div');
    if (!clickedInside && this.selectedRolee!='') {
      event.stopPropagation(); 
    }
  }

  toggleSortOrder(column: string): void {
    this.sortedOrder = (this.sortedOrder+1) % 3;
    this.sortedColumn = column;
    this.GetUsers();
  }

}