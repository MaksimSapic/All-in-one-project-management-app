import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MailresetService } from '../../_services/mailreset.service';
import { ResetRequest } from '../../Entities/ResetRequest';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-reset',
  templateUrl: './forgot-reset.component.html',
  styleUrl: './forgot-reset.component.css'
})
export class ForgotResetComponent implements OnInit{
  
  newRequest: ResetRequest = {
    Email: '',
    Token: '',
    NewPassword: '',
  };
  buttonClicked: boolean = false;
  invalidPassword: boolean = false;
  confirmPassword: string = '';

  constructor(
    private mailresetService: MailresetService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
    ) { }

  token: any;
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.toString();
    this.GetEmailByToken(this.token)
  }

  GetEmailByToken(token: string | null): void {
    if (!token) {
      console.error('Token is missing.');
      return;
    }
    this.mailresetService.getEmailByToken(token).subscribe({
      next: (response: any) => {
        const email = response?.email;
        if (email) {
          this.newRequest.Email = email;
        } else {
          console.error('Email not found in response.');
        }
      },
      error: (error) => {
        console.error('Error fetching email:', error);
      },
    });
  }

  checkPasswords(){
    if(!this.newRequest.NewPassword || this.newRequest.NewPassword.length < 5){
      this.newRequest.NewPassword = '';
      this.confirmPassword = '';
      this.invalidPassword = true;
      return false;
    }
    if (this.newRequest.NewPassword !== this.confirmPassword) {
      return false;
    }
    if(this.token == undefined){
      this.newRequest.NewPassword = '';
      this.confirmPassword = '';
      this.invalidPassword = false;
      this.toastr.error("Recovery token doesn't exists.")
      return false;
    }

    return true;
  }

  resetPassword() {
    this.buttonClicked = true;

    if(!this.checkPasswords())
        return;

    this.newRequest.Token = this.token;
    this.mailresetService.resetPassword(this.newRequest).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (obj) => {
        if(this.token)
          this.toastr.error(obj.error.message);
        this.invalidPassword = false;
        this.newRequest.NewPassword = '';
        this.confirmPassword = '';
      }
    })
  }

  passwordMatch(): boolean {
    return this.newRequest.NewPassword === this.confirmPassword;
  }

  disableRightClick(event: MouseEvent): void {
    event.preventDefault();
  }
}