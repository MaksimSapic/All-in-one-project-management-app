import { Component, OnInit } from '@angular/core';
import { RegisterService } from '../../_services/register.service';
import { AppUser } from '../../Entities/AppUser';
import { ActivatedRoute, Router } from '@angular/router';
import { Invintation } from '../../Entities/Invitation';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  newUser: AppUser = {
    FirstName: '',
    LastName: '',
    Email: '',
    Password: '',
    Token: '',
  };
  Invintation: Invintation = {
    Email: '',
    Token: '',
  };
  confirmPassword: string = '';

  regexName: RegExp = /^[A-Za-zĀ-ž]{2,}$/;
  buttonClicked: boolean = false;

  constructor(
    private registerService: RegisterService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
  ) { }
  
  token: any;
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.GetEmailByToken(this.token);
  }

  GetEmailByToken(token: string | null): void {
    if (!token && token == undefined) {
      return;
    }

    this.registerService.getEmailByToken(token).subscribe({
      next: (response: any) => {
        const email = response?.email;
        if (email) 
        {
          this.newUser.Email = email;
        } 
      },
      error: () => {},
    });
  }

  Register(): void {
    this.buttonClicked = true;
    if (!this.checkFirstName() || !this.checkLastName() || !this.checkPassword() || !this.passwordMatch())
      return;
    if(!this.token || this.newUser.Email == '')
    {
      this.toastr.error("Invalid token provided");
      return
    }

    this.newUser.Token = this.token;

    this.registerService.register(this.newUser).subscribe({
      next: (response) => {
        localStorage.setItem('id', response.id);
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        this.router.navigate(['/mytasks']);
      },
      error: (error) => {
        this.toastr.error(error.error.message);
      },
    });
  }

  checkFirstName(): boolean{
    return this.newUser.FirstName!=null && this.regexName.test(this.newUser.FirstName);
  }

  checkLastName(): boolean{
    return this.newUser.LastName!=null && this.regexName.test(this.newUser.LastName);
  }

  checkPassword(): boolean{
    return this.newUser.Password!=null && this.newUser.Password.length >= 5
  }

  passwordMatch(): boolean {
    return this.newUser.Password === this.confirmPassword;
  }

  disableRightClick(event: MouseEvent): void {
    event.preventDefault();
  }
}