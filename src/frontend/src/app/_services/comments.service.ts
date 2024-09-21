import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment } from '../Entities/Comments';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  postComment(commentDto: any): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/postComment`, commentDto, {headers:this.getHeaders()});
  }

  getComments(taskId: number): Observable<any> {
    return this.http.get<Comment[]>(`${this.apiUrl}/getComments/${taskId}`, {headers:this.getHeaders()});
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deleteComment/${commentId}`, {headers:this.getHeaders()});
  }
  
  updateComment(commentId: number, content: string): Observable<Comment> {
    const url = `${this.apiUrl}/updateComment/${commentId}/${content}`;
    return this.http.put<Comment>(url, null, {headers:this.getHeaders()});
  }

}