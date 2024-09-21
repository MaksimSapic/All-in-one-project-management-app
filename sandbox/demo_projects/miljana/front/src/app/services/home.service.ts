import { Injectable } from '@angular/core';
import { Environments } from '../environment/Environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppUser } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  backUrk=Environments.backUrl

  constructor(private httpClient:HttpClient) { }

  getAll():Observable<AppUser[]>{
    return this.httpClient.get<AppUser[]>(`${this.backUrk}/users`)
  }
  
}
