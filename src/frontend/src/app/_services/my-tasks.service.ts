import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { ProjectTask } from '../Entities/ProjectTask';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskDependency } from '../Entities/TaskDependency';
import { DateTimeDto } from '../Entities/DateTimeDto';
import { sectionChangeDTO } from '../Entities/sectionChangeDTO';
import { DateTimeDto1 } from '../Entities/DateTimeDto1';
import { TaskStatusDto } from '../Entities/TaskStatusDto';
import { UpdateTaskDescription } from '../Entities/UpdateTaskDescription';

@Injectable({
  providedIn: 'root',
})
export class MyTasksService {
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/projectTask`;
  sectionDeleted = new EventEmitter<void>();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  GetProjectTasks(): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(this.baseUrl,{headers:this.getHeaders()});
  }

  GetTasksByProjectId(
    projectId: number, 
    sortedColumn: string | null = null, 
    sortedOrder: number = 0, 
    searchText: string | null = null,
    taskStatus: string | null = null,
    startDate: string | null = null,
    endDate: string | null = null
  ): Observable<ProjectTask[]> {
    let params = new HttpParams()
      .set('sortedColumn', sortedColumn ? sortedColumn : '')
      .set('sortedOrder', sortedOrder.toString())
      .set('searchText', searchText ? searchText : '')
      .set('taskStatus', taskStatus ? taskStatus : '')
      .set('startDate', startDate ? startDate : '')
      .set('endDate', endDate ? endDate : '');
  
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/ByProject/${projectId}`, { headers: this.getHeaders(), params: params });
  }

  GetTasksByUserId(userId: any): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/user/${userId}`,{headers:this.getHeaders()});
  }

  GetProjectTask(taskId: number, userId: any): Observable<ProjectTask> {
    return this.http.get<ProjectTask>(`${this.baseUrl}/${taskId}/${userId}`,{headers:this.getHeaders()});
  }
  //tico: mirkov updateTaskStatus. Treba da se promeni
  updateTaskStatus1(id: number, statusName: string,senderid:number): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/updateStatus/${id}/${statusName}`,senderid,{headers:this.getHeaders()});
  }

  // kada pomeram taskove iz archived saljem listu zbog boljih performansi
  UpdateArchTasksToCompleted(taskIds: number[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateArchTasksToCompleted`,taskIds,{headers:this.getHeaders()});
  }

  updateTicoTaskStatus(taskId: number, task: ProjectTask): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/updateTicoStatus/${taskId}`, task, {headers:this.getHeaders()});
  }

  //tico kanban ; ne diraj!
  GetTaskStatuses(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/statuses/${projectId}`, {headers:this.getHeaders()});
  }
  // za kanban
  updateTaskStatusPositions(updatedStatuses: any[], projectId: number): Observable<any> {
    const payload = updatedStatuses.map(status => ({ ...status, projectId }));
    return this.http.put(`${this.baseUrl}/updateStatusPositions`, payload, {headers:this.getHeaders()});
  }
  
  sortTasksByDueDate(userId:any,sortOrder: string): Observable<ProjectTask[]> {
    const url = `${this.baseUrl}/sortTasksByDueDate/${userId}?sortOrder=${sortOrder}`;
    return this.http.get<ProjectTask[]>(url,{headers:this.getHeaders()});
  }
  // za addNewSection modal
  addTaskStatus(taskStatus: { statusName: string; projectId: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/addTaskStatus`, taskStatus, {headers:this.getHeaders()});
  }
  // za addNewTask modal
  createTask(task: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, task, {headers:this.getHeaders()});
  }
  // za deleteSection modal
  deleteTaskStatus(taskStatusId: number | null): Observable<any> {
    if (taskStatusId === null) {
      throw new Error('Task status ID is null');
    }
    return this.http.delete(`${this.baseUrl}/deleteTaskStatus/${taskStatusId}`, {headers:this.getHeaders()});
  }

  GetNewTasksByUserId(userId: any, count: number,sortedColumn:string|null=null,sortedOrder:number=0): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/user/${userId}/count1/${count}?sortedColumn=${sortedColumn}&sortedOrder=${sortedOrder}`, {headers:this.getHeaders()});
  }
  GetSoonTasksByUserId(userId: any, count: number,sortedColumn:string|null=null,sortedOrder:number=0): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/user/${userId}/count2/${count}?sortedColumn=${sortedColumn}&sortedOrder=${sortedOrder}`, {headers:this.getHeaders()});
  }
  GetClosedTasksByUserId(userId: any, count: number,sortedColumn:string|null=null,sortedOrder:number=0): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/user/${userId}/count3/${count}?sortedColumn=${sortedColumn}&sortedOrder=${sortedOrder}`, {headers:this.getHeaders()});
  }

  changeTaskName(taskId: any, newName: string): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/changeTaskName/${taskId}/${newName}`, null, { headers: this.getHeaders() });
  }
  
  changeTaskDescription(dto: UpdateTaskDescription): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/changeTaskDescription`, dto, { headers: this.getHeaders() });
  }
  
  changeTaskDueDate(taskId: any, dto: DateTimeDto1): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/changeTaskDueDate/${taskId}`, dto, { headers: this.getHeaders() });
  }

  changeTaskAppUserId(taskId: any, newAppUserId: any,senderid:any): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/changeTaskAppUserId/${taskId}/${newAppUserId}`, senderid, { headers: this.getHeaders() });
  }
  
  changeTaskSectionId(taskId: any, newSectionId: any): Observable<ProjectTask> {
    return this.http.put<ProjectTask>(`${this.baseUrl}/changeTaskSectionId/${taskId}/${newSectionId}`, null, { headers: this.getHeaders() });
  }

  addTaskDependencies(dtos: TaskDependency[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/addTaskDependency`, dtos, {headers:this.getHeaders()});
  }

  deleteTaskDependency(dto: TaskDependency): Observable<any> {
    return this.http.post(`${this.baseUrl}/deleteTaskDependency`, dto, {headers:this.getHeaders()});
  }
  deleteAllTaskDependency(dtos: TaskDependency[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/deleteAllTaskDependency`, dtos, {headers:this.getHeaders()});
  }
  GetAllTasksDependencies():Observable<TaskDependency[]>{
    return this.http.get<TaskDependency[]>(`${this.baseUrl}/getAllTasksDependencies`, {headers:this.getHeaders()});
  }

  deleteTask(taskId: number): Observable<any> {
    const url = `${this.baseUrl}/deleteTask/${taskId}`;
    return this.http.delete(url, {headers:this.getHeaders()});
  }
  GetTaskDependencies(id:any):Observable<TaskDependency[]>{
    return this.http.get<TaskDependency[]>(`${this.baseUrl}/getTaskDependencies/${id}`, {headers:this.getHeaders()});
  }
  UpdateTimeGantt(id:any,startDate:Date,endDate:Date){
    var newDatetime:DateTimeDto = {
      StartDate:startDate,
      EndDate:endDate,
    }
    return this.http.post<any>(`${this.baseUrl}/timeUpdateGantt/${id}`,newDatetime, {headers:this.getHeaders()});
  }
  ChangeTaskSection(id_section:number,id_task:number):Observable<any>{
    var data : sectionChangeDTO = {
      sectionId:id_section,
      taskId:id_task
    }
    return this.http.post<any>(`${this.baseUrl}/changeSectionGantt/`,data, {headers:this.getHeaders()});
  }
  TaskNameExists(taskName: string,projectID:number): Observable<ProjectTask> {
    return this.http.get<ProjectTask>(`${this.baseUrl}/getTaskByName/${taskName}/${projectID}`, {headers:this.getHeaders()});
  }

  renameTaskStatus(changedTaskStatusDto: TaskStatusDto): Observable<any> {
    return this.http.put(`${this.baseUrl}/RenameTaskStatus/`, changedTaskStatusDto, { headers: this.getHeaders() });
  }
}