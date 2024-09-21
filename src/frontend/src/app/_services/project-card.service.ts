import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Member } from '../Entities/Member';
import { Project } from '../Entities/Project';
import { CreateProject } from '../Entities/CreateProject';
import { ProjectMember } from '../Entities/ProjectMember';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectCardService {
  private apiUrl = environment.apiUrl;
  private projectUrl = `${this.apiUrl}/projects`;
  private userUrl = `${this.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  GetAvailableUsers(projectCreatorId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.userUrl}/availableUsers/${projectCreatorId}`,{headers:this.getHeaders()});
  }

  ProjectNameExists(projectName: string): Observable<Project> {
    return this.http.get<Project>(`${this.projectUrl}/getProjectByName/${projectName}`,{headers:this.getHeaders()});
  }

  CreateProject(project: CreateProject): Observable<any> {
    return this.http.post<Project>(`${this.projectUrl}`, project, {responseType: 'json',headers:this.getHeaders()});
  }

  AddProjectMembers(projectMember: ProjectMember[]):Observable<any>{
    return this.http.put<any>(`${this.projectUrl}/addProjectMembers`, projectMember, {responseType: 'json',headers:this.getHeaders()})
  }

  CheckProjectStatus(projectId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.projectUrl}/isArchived/${projectId}`,{headers:this.getHeaders()});
  }

}