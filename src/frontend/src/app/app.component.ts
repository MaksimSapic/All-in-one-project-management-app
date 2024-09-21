import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from './_services/notifications.service';
import { ThemeServiceService } from './_services/theme-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'frontend';

  constructor(
    private router: Router,
    public notificationService: NotificationsService,
    private themeService: ThemeServiceService
  ) {}

  ngOnInit(): void {
    this.applyTheme();
  }

  private applyTheme(): void {
    const isDarkTheme = localStorage.getItem('isDarkTheme') === 'true';
    this.themeService.applyTheme(isDarkTheme);
  }

  isLoginOrRegisterPage(): boolean {
    return this.router.url === '/login' || this.router.url.startsWith('/landing') || this.router.url.startsWith('/register') || this.router.url === '/forgotpass' || this.router.url.startsWith('/forgotreset') ;
  }
}