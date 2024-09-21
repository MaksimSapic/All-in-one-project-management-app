import { Injectable } from '@angular/core';
import { AppUser } from '../Entities/AppUser';
import { Invintation } from '../Entities/Invitation';
import { Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  constructor(private httpClient: HttpClient) {}

  private apiUrl = environment.apiUrl;

  register(appUser: AppUser): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/account/register`, appUser, {
      responseType: 'json',
    });
  }
  getEmailByToken(token: string): Observable<Invintation> {
    return this.httpClient.get<Invintation>(
      `${this.apiUrl}/users/token/${token}`
    );
  }
}