import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppUser } from '../Entities/AppUser';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private http: HttpClient, private toastr: ToastrService) { }

  private apiUrl = environment.apiUrl + '/account';

  login(newUser: AppUser): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, newUser, {
      responseType: 'json',
    });
  }

  IsTokenValid(token: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/validToken/${token}`);
  }

  async checkToken(): Promise<boolean> {
    let token = localStorage.getItem('token');
    if (token) {
      var valid = await firstValueFrom(this.IsTokenValid(token));
      return valid ? true : false;
    }
    return false;
  }
}