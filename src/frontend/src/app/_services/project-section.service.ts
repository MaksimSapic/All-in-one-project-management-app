import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectSection } from '../Entities/ProjectSection';

@Injectable({
  providedIn: 'root'
})
export class ProjectSectionService {
  private apiUrl = environment.apiUrl + '/ProjectSection';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  getSectionsByProject(projectId: number): Observable<ProjectSection[]> {
    return this.http.get<ProjectSection[]>(`${this.apiUrl}/project/${projectId}`, {headers:this.getHeaders()});
  }

  createSection(sectionName: string, projectId: number): Observable<ProjectSection> {
    const body = { sectionName, projectId };
    return this.http.post<ProjectSection>(this.apiUrl, body, {headers:this.getHeaders()});
  }

  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sectionId}`, {headers:this.getHeaders()});
  }
}