import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { AddItemRequest } from '../models/add-item-request.model';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = 'https://localhost:5001/api/Todo/';
  constructor(private http: HttpClient) { }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getTask(id: number): Observable<Task> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Task>(url);
  }
  
  addItem(model: AddItemRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, model);
  }
}