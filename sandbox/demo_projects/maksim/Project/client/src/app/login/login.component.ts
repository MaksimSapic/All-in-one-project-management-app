import { AppService } from './../app.service';
import { Component } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username?: string;
  password?: string;

  constructor(private AppService: AppService, private router: Router) {}
  async onSubmit(): Promise<void> {
    if (this.username && this.password) {
      try {
        //mrzi me mnogo da ovo povezujem kako treba par sati pred team meeting..
        // const response = await this.AppService.login(this.username).toPromise();
        this.router.navigate(['/index']);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  }
}
