import { ChangePassword } from '../Entities/ChangePassword';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserinfoService {
  constructor(private readonly httpClient:HttpClient) {}

  private apiUrl=environment.apiUrl;
  private baseUrl = `${this.apiUrl}/users/changePassword`;

  getUserInfo(id:any,token:any){
    var httpheaders = new HttpHeaders({
      'Authorization':`Bearer ${token}`
    })
    return this.httpClient.get<any>(`${this.apiUrl}/users/${id}`,{headers:httpheaders});
  }
  updateUserInfo(token: any, id:number, data:ChangePassword):Observable<any>{
    const url = `${this.baseUrl}/${id}`;
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    const response = this.httpClient.put<any>(url,JSON.stringify(data),{headers:headers})
    return response;
  }

  getUserInfo2(id: any): Observable<any>{

    let token=localStorage.getItem("token");
    if(token)
    {
      let httpHeader=new HttpHeaders({
        "Authorization": `Bearer ${token}`
      });

      return this.httpClient.get<any>(`${this.apiUrl}/users/${id}`,{headers:httpHeader})
    }
    else return of(null); //u slucaju da nisam ulogovan i nemam korisnika nemoj da mi uzimas info o korisniku

  }
}