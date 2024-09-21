import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'ToDo Application';
  tasks: any;

  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    this.http.get('https://localhost:5001/api/Todo').subscribe({
      next: response => this.tasks = response,
      error: error => console.log(error),
      complete: () => console.log("Request has completed")
    })
  }
}
