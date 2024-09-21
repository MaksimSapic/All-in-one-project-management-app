import { Component, OnInit } from '@angular/core';
import { MailReset } from '../../Entities/MailReset';
import { MailresetService } from '../../_services/mailreset.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-pass',
  templateUrl: './forgot-pass.component.html',
  styleUrl: './forgot-pass.component.css'
})
export class ForgotPassComponent implements OnInit{
  
  resetEmail: MailReset = {
    Receiver: ''
  };
  emailSent: boolean = false;
  constructor(private mailreset: MailresetService, private toastr: ToastrService) { }

  ngOnInit(): void { }

  sendResetLink() {
    this.mailreset.sendResetLink(this.resetEmail).subscribe({
      next: response => {
        this.emailSent = true;
      },
      error: error => {
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
      }
    })
  }

  disableRightClick(event: MouseEvent): void {
    event.preventDefault();
  }
}