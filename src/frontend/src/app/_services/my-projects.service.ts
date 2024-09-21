import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../Entities/Project';
import { Member } from '../Entities/Member';
import { UpdateProject } from '../Entities/UpdateProject';
import { ProjectMember } from '../Entities/ProjectMember';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MyProjectsService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl,{headers:this.getHeaders()});
  }

  getUsersProjects(id: any): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/getUsersProjects/${id}`,{headers:this.getHeaders()});
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`,{headers:this.getHeaders()});
  }
  filterAndPaginateProjects(
    searchText:string|null=null,
    projectStatus: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    userId: any = null,
    currentPage: number = 0,
    pageSize: number = 0,
    sortedColumn:string|null=null,
    sortedOrder:number=0
  ): Observable<Project[]> {
    let params = new HttpParams();
    if (searchText) {
      params = params.set('searchText', searchText);
    }
    if (projectStatus) {
      params = params.set('projectStatus', projectStatus);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (userId) {
      params = params.set('userId', userId);
    }
    if (sortedColumn) {
      params = params.set('sortedColumn', sortedColumn);
    }
    if (sortedOrder) {
      params = params.set('sortedOrder', sortedOrder);
    }
    if (currentPage) {
      params = params.set('currentPage', currentPage.toString());
    }
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<Project[]>(`${this.baseUrl}/filterAndPaginate`, { params: params , headers:this.getHeaders()});
  }

  CountFilteredProjects(
    searchText:string|null=null,
    projectStatus: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null,
    userId: any = null,
    currentPage: number = 0,
    pageSize: number = 0,
    sortedColumn:string|null=null,
    sortedOrder:number=0
  ): Observable<number> {
    let params = new HttpParams();
    if (searchText) {
      params = params.set('searchText', searchText);
    }
    if (projectStatus) {
      params = params.set('projectStatus', projectStatus);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (userId) {
      params = params.set('userId', userId);
    }
    if (sortedColumn) {
      params = params.set('sortedColumn', sortedColumn);
    }
    if (sortedOrder) {
      params = params.set('sortedOrder', sortedOrder);
    }
    if (currentPage) {
      params = params.set('currentPage', currentPage.toString());
    }
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<number>(`${this.baseUrl}/countFiltered`, { params: params, headers:this.getHeaders()});
  }

  GetUsersProjectsCount(id: any): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/getUsersProjectsCount/${id}`,{headers:this.getHeaders()});
  }

  getUsersByProjectId(projectId: number): Observable<any> {
    if(projectId === null)
      throw new Error('ProjetId is null.');
    return this.http.get(`${this.baseUrl}/GetUsersByProjectId/${projectId}`,{headers:this.getHeaders()})
  }

  getAvailableAssigness(projectId: number): Observable<any> {
    if(projectId === null)
      throw new Error('ProjetId is null.');
    return this.http.get(`${this.baseUrl}/GetAvailableAssigness/${projectId}`,{headers:this.getHeaders()})
  }

  GetAddableUsers(projectCreatorId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.baseUrl}/GetAddableUsers/${projectCreatorId}`,{headers:this.getHeaders()});
  }

  UpdateProject(update: UpdateProject): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/updateProject`, update, {responseType: 'json',headers:this.getHeaders()});
  }

  AddProjectMembers(projectMember: ProjectMember[]):Observable<any>{
    return this.http.put<any>(`${this.baseUrl}/addProjectMembers`, projectMember, {responseType: 'json',headers:this.getHeaders()})
  }

  DeleteProjectMember(projectId: number,userId: number):Observable<any>{
    return this.http.delete<ProjectMember>(`${this.baseUrl}/DeleteProjectMember/${projectId}/${userId}`,{headers:this.getHeaders()})
  }

  UpdateUsersProjectRole(member: ProjectMember):Observable<any>{
    return this.http.post<ProjectMember>(`${this.baseUrl}/UpdateUsersProjectRole`, member, {responseType: 'json',headers:this.getHeaders()})
  }

  GetProjectSections(projectId:number):Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/ProjectSection/project/${projectId}`,{headers:this.getHeaders()});
  }

  GetProjectOwner(projectId:number):Observable<Member>{
    return this.http.get<any>(`${this.baseUrl}/GetProjectOwner/${projectId}`,{headers:this.getHeaders()});
  }

  archiveProject(projectId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/projects/archive/${projectId}`,null, {headers:this.getHeaders()});
  }

  getUsersArchivedProjects(userId: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getUsersArchivedProjects/${userId}`,{headers:this.getHeaders()});
  }

  removeProjectsFromArchived(projectIds: number[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/unarchiveMultiple`, JSON.stringify(projectIds), { 
      headers: this.getHeaders().set('Content-Type', 'application/json')
    });
  }

  getUserProjectRole(projectId: number, userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/getProjectUserRole/${projectId}/${userId}`,{  headers: this.getHeaders() });
  }
}