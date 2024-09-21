import { Component, OnInit } from '@angular/core';
import { LoginService } from '../../_services/login.service';
import { AppUser } from '../../Entities/AppUser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  newUser: AppUser = {
    Email: '',
    Password: '',
  };

  constructor(
    private loginService: LoginService,
    private router: Router,
    private toastr: ToastrService,
    ) { }

  ngOnInit(): void { }

  login() {
    this.loginService.login(this.newUser).subscribe({
      next: (response) => {
        localStorage.setItem('id', response.id);
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        if(localStorage.getItem('role')=='0')
        {
          this.router.navigate(['/admin']);
          sessionStorage.setItem('selectedOption', "Admin");
          localStorage.setItem('selectedOption', "Admin");
        }
        else
        {
          this.router.navigate(['/mytasks']);
          sessionStorage.setItem('selectedOption', "MyTasks");
          localStorage.setItem('selectedOption', "MyTasks");
        }
      },
      error: (error) => {
        console.log(error);
        let errorMessage = '';
        if (error.error.errors) {
          for (const key in error.error.errors) {
            if (error.error.errors.hasOwnProperty(key)) {
              errorMessage += error.error.errors[key].join(' ') + ' ';
            }
          }
          this.toastr.error(errorMessage.trim());
        } else {
          this.toastr.error(error.error)
        }
      },
    });
  }

  disableRightClick(event: MouseEvent): void {
    event.preventDefault();
  }
}