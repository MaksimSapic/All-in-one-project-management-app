import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MailReset } from '../Entities/MailReset';
import { Observable } from 'rxjs/internal/Observable';
import { ResetRequest } from '../Entities/ResetRequest';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MailresetService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) { }
  
  sendResetLink(email: MailReset): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/sendRecovery`, email, {
      responseType: 'json'
    });
  }

  getEmailByToken(token: string): Observable<ResetRequest> {
    return this.http.get<ResetRequest>(
      `${this.apiUrl}/account/token/${token}`
    );
  }

  resetPassword(resetRequest: ResetRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/account/resetPassword`, resetRequest, {
      responseType: 'json',
    });
  }
}