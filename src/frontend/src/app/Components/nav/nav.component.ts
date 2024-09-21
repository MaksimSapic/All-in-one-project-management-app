import { NavigationEnd, Router } from '@angular/router';
import { UserinfoService } from '../../_services/userinfo.service';
import { Component, OnInit } from '@angular/core';
import { NotificationsService } from '../../_services/notifications.service';
import { UploadService } from '../../_services/upload.service';
import { filter } from 'rxjs';
import { ThemeServiceService } from '../../_services/theme-service.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent implements OnInit {

  constructor(
    private router: Router,
    private userInfo:UserinfoService, 
    public uploadService:UploadService,
    public notificationService:NotificationsService,
    public themeService: ThemeServiceService
    ) { }

  ngOnInit(): void {
    this.isAdmin()
    if(localStorage.getItem('token')) { // proveri dal token postoji
      this.getUser();
      this.notificationService.createHubConnection();
    }
    this.navigation();
    this.setActiveOption(this.selectedOption)
  }
  admin!: boolean
  logovan!: boolean
  user!:any

  imgFlag: boolean=false;
  notification_list:any;

  isMyProjectsActive: boolean = false;

  selectedOption: string='';

  changeTheme() {
    this.themeService.switchTheme();
  }

  async Logout(): Promise<void> {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      localStorage.removeItem('role');
      localStorage.removeItem('selectedOption');
      sessionStorage.removeItem('selectedOption');
      this.notificationService.stopHubConnection();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('redirect failed:', error);
    }
  }

  isAdmin(): boolean {
   return localStorage.getItem('role')==='0';
  }

  isProjectManager(): boolean {
    return localStorage.getItem('role')==='2';
  }

  getUser(): void{
    var id=localStorage.getItem('id')
    if(id){
      this.userInfo.getUserInfo2(id).subscribe({
        next:(response)=>{
          this.user=response;
        }
      })
    }
  }

  redirectToMyTasks(): void {
    this.router.navigate(['/mytasks']);
  }

  navigation():void{
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/mytasks')) {
        this.selectedOption = 'MyTasks'
      }
      else if(event.urlAfterRedirects.includes('/myprojects') || event.urlAfterRedirects.includes('/project/'))
      {
        this.selectedOption = 'MyProjects'
      }
      else if(event.urlAfterRedirects.includes('/admin'))
      {
        this.selectedOption = 'Admin' 
      }
      else if(event.urlAfterRedirects.includes('/userinfo'))
      {
        this.selectedOption = '' 
      }
      else {
        this.selectedOption=''
      }
      localStorage.setItem('selectedOption', this.selectedOption);

    });
    const storedOption = localStorage.getItem('selectedOption');
    this.selectedOption = storedOption && storedOption !== 'null' ? storedOption : '';
  }

  setActiveOption(option: string) {
    if (option === '') {
      sessionStorage.removeItem('selectedOption');
      localStorage.removeItem('selectedOption');
    } else {
      sessionStorage.setItem('selectedOption', option);
      localStorage.setItem('selectedOption', option);
    }
  }

}