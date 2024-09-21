import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Task } from '../models/task.model';

import { Observable } from 'rxjs';
import { AddItemRequest } from '../models/add-item-request.model';
@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})
export class ItemListComponent implements OnInit {
  private apiUrl = 'https://localhost:5001/api/Todo/';
  tasks: Task[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getTasks();
  }

  getTasks(): void {
    this.http.get<Task[]>(this.apiUrl).subscribe(tasks => this.tasks = tasks);
  }
  getTask(id: number): Observable<Task> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Task>(url);
  }
  
  addItem(model: AddItemRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, model);
  }
  
  

  

  // deleteTask(taskId: number) {
  //   this.taskService.delete(`${this.apiUrl}/${taskId}`).subscribe(() => {
  //     this.fetchTasks();
  //   });
  // }
}
