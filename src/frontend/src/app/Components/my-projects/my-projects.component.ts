import { Component, HostListener, OnInit, TemplateRef  } from '@angular/core';
import { MyProjectsService } from '../../_services/my-projects.service';
import { Project, ProjectStatus } from '../../Entities/Project';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { Member, UserRole } from '../../Entities/Member';
import { UploadService } from '../../_services/upload.service';
import { switchMap } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ArchivedProject } from '../../Entities/ArchivedProject';

@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css']
})
export class MyProjectsComponent implements OnInit {
  all_projects: number = 0;
  projects: Project[] = [];
  filteredProjects: number = 0;
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 0;
  originalProjects: Project[] = [];
  totalPagesArray: number[] = [];
  rangeDates: Date[] | undefined;

  selectedStatus: string = '';
  userRole: UserRole | any;
  projectOwners: { [projectId: number]: Member | null } = {};
  searchText: string='';
  
  showProjectCard: boolean = false;
  modalRef?: BsModalRef;

  archivedProjects: ArchivedProject[] = [];
  sortedColumn: string = '';
  sortedOrder: number = 0; 

  constructor(
    private myProjectsService: MyProjectsService,
    private spinner: NgxSpinnerService,
    public uploadservice: UploadService,
    private router: Router,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    const userId = localStorage.getItem('id')
    this.userRole = localStorage.getItem('role');

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

    this.myProjectsService.GetUsersProjectsCount(userId).pipe(
      switchMap((count: number) => {
        this.all_projects = count;
        return this.myProjectsService.filterAndPaginateProjects(
          this.searchText,
          this.selectedStatus,
          startDate,
          endDate,
          userId,
          this.currentPage,
          this.pageSize,
          this.sortedColumn,
          this.sortedOrder
        );
      })
    ).subscribe((projects: Project[]) => {
      this.projects = projects;
      this.filteredProjects = this.all_projects;
      this.totalPages = Math.ceil(this.all_projects / this.pageSize);
      this.totalPagesArray = Array.from({ length: this.totalPages }, (_, index) => index + 1);
      this.loadProjectOwners();
      this.spinner.hide();
    });
  }

  loadProjects(userId: any): void {
    this.spinner.show();
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
    this.myProjectsService.filterAndPaginateProjects(
      this.searchText,
      this.selectedStatus,
      startDate,
      endDate,
      userId,
      this.currentPage,
      this.pageSize,
      this.sortedColumn,
      this.sortedOrder
    ).subscribe((projects: Project[]) => {
      this.projects = projects;
      this.loadProjectOwners();
      this.spinner.hide();
    });
    this.myProjectsService.CountFilteredProjects( this.searchText,
      this.selectedStatus,
      startDate,
      endDate,
      userId,
      this.currentPage,
      this.pageSize,
    ).subscribe((filteredProjects: number) => {
      this.filteredProjects=filteredProjects;
      this.totalPages = Math.ceil(this.filteredProjects / this.pageSize);
      this.totalPagesArray = Array.from({ length: this.totalPages }, (_, index) => index + 1);
      this.spinner.hide();
    });
  }

  loadProjectOwners(){
    this.projects.forEach(project => {
      this.myProjectsService.GetProjectOwner(project.id).subscribe((owner: Member) => {
        this.projectOwners[project.id] = owner
      })
   });
  }

  getStatusString(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.Proposed:
        return 'PROPOSED';
      case ProjectStatus.InProgress:
        return 'IN PROGRESS';
      case ProjectStatus.Completed:
        return 'COMPLETED';
      case ProjectStatus.Archived:
        return 'ARCHIVED';
      default:
        return '';
    }
  }

  handleStatusChange(event: any) {
    this.selectedStatus = event.target.value;
  }

  goToProject(id: number) {
    this.router.navigate(['/project', id]);
  }

  filterProjects(): void {
    this.spinner.show();
     this.currentPage = 1;
    const id = localStorage.getItem('id');
    this.loadProjects(id);
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.filterProjects();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      const id = localStorage.getItem('id');
    this.loadProjects(id);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      const id = localStorage.getItem('id');
    this.loadProjects(id);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      const id = localStorage.getItem('id');
    this.loadProjects(id);
    }
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value !== '') {
      this.currentPage=1;
      const pageSize = Number(target.value);
      this.pageSize = pageSize;
      const id = localStorage.getItem('id');
      this.loadProjects(id);
    }
  }

  ToggleProjectCard() {
    this.showProjectCard = !this.showProjectCard;
  }

  handleCloseCard(){
    this.showProjectCard = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
      if (!(event.target as HTMLElement).closest('.proj_card') && !(event.target as HTMLElement).closest('.btn.btn-primary.btn-sm')) {
        this.handleCloseCard();
      }
  }

  handleDateRangeChange(selectedDates: Date[] | undefined) {
    if (selectedDates && selectedDates.length === 2) {
      const startDate = selectedDates[0];
      const endDate = selectedDates[1];
  }
}

isOverdue(endDate: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endDateReset = new Date(endDate);
  endDateReset.setHours(0, 0, 0, 0);
  return endDateReset < now;
}

  getProgressClass(progress: number): string {
    return progress <= 15? 'progress-type2' : 'progress-type1';
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

  openViewArchProjModal(modal: TemplateRef<void>) {
    const userId = localStorage.getItem('id');
    this.myProjectsService.getUsersArchivedProjects(userId).subscribe({
      next: (response: { project: { id: number; projectName: string; startDate: string; endDate: string; }, owner?: { firstName: string; lastName: string; profilePicUrl?: string } }[]) => {
        this.archivedProjects = response.map(item => ({
          id: item.project.id,
          projectName: item.project.projectName,
          startDate: new Date(item.project.startDate),
          endDate: new Date(item.project.endDate),
          ownerFirstName: item.owner ? item.owner.firstName : undefined,
          ownerLastName: item.owner ? item.owner.lastName : undefined,
          ownerProfilePicture: item.owner ? item.owner.profilePicUrl : undefined
        }));
        this.modalRef = this.modalService.show(modal, {
          class: 'modal-lg modal-dialog-centered'
        });
      },
      error: (error) => {
        console.error('Error fetching archived projects:', error);
      }
    });
  }

  removeProjectFromArchived() {
    this.spinner.show();
    const selectedProjectIds = this.archivedProjects
      .filter(project => project.selected)
      .map(project => project.id);
    this.myProjectsService.removeProjectsFromArchived(selectedProjectIds).subscribe({
      next: () => {
        this.modalRef?.hide();
        this.loadProjects(localStorage.getItem('id'));
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error removing projects from archived:', error);
        this.spinner.hide();
      }
    });
  }


  toggleSortOrder(column: string): void {
    const userId = localStorage.getItem('id');
    if (this.sortedColumn === column) {
      this.sortedOrder = (this.sortedOrder + 1) % 3;
    } else {
      this.sortedColumn = column;
      this.sortedOrder = 1;
    }
    this.loadProjects(userId);
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
}