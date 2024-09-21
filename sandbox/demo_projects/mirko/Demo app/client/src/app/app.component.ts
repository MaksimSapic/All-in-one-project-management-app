import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'User menagement';
  users: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers() {
    this.http.get('http://localhost:5111/api/users').subscribe({
      next: (response) => (this.users = response),
      error: (error) => console.log(error),
      complete: () => console.log('Request has completed'),
    });
  }

  addUser(userName: string, userAge: string) {
    if (!userName) {
      console.error('Please enter a user name');
      return;
    }

    // Find the maximum ID currently in use
    const maxId = this.users.reduce(
      (max: number, user: { id: number }) => (user.id > max ? user.id : max),
      0
    );

    // Create a new user with the next maximum ID
    const newUser = { id: maxId + 1, userName: userName, userAge: userAge };

    // Send a POST request to add the new user
    this.http.post('http://localhost:5111/api/users', newUser).subscribe({
      next: () => {
        console.log('User added successfully');
        this.getUsers(); // Refresh the list of users
      },
      error: (error) => console.log(error),
    });
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.http.delete(`http://localhost:5111/api/users/${userId}`).subscribe({
      next: () => {
        console.log('User deleted successfully');
        this.getUsers();
      },
      error: (error) => console.log(error),
    });
  }
}
