import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;
  private fileurl = environment.fileurl;
  private baseUrl = `${this.apiUrl}/FileUpload`;

  constructor(private readonly httpClient:HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({"Authorization": `Bearer ${token}`});
  }

  UploadImage(id:any,imageData:File,token:any){
    const formData = new FormData();
    formData.append('image',imageData,imageData.name);
    return this.httpClient.post<any>(`${this.baseUrl}/uploadpfp/${id}`,formData,{headers:this.getHeaders()}); // saljem sliku na back
  }

  getImage(filename:string){//ova vraca avatare
    return `${environment.imageUrl}AVATAR_${filename}`;
  }

  getProfileImage(filename:string){
    return `${environment.imageUrl}${filename}`;
  }

  UploadFile(id:any,user_id:any,file:File,token:any){
    const formData = new FormData();
    formData.append('file',file,file.name);
    formData.append('user_id',String(user_id));
    return this.httpClient.post<any>(`${this.apiUrl}/FileUpload/uploadfile/${id}`,formData,{headers:this.getHeaders()});
  }

  removePfp(id:any,token:any){
    return this.httpClient.delete<any>(`${this.apiUrl}/FileUpload/removepfp/${id}`,{headers:this.getHeaders()});
  }

  downloadFile(fileUrl:string){
    return this.httpClient.get(`${this.fileurl}${fileUrl}`, { responseType: 'blob',headers:this.getHeaders()});
  }
  checkFileType(file:File):boolean{
    var extension = file.name.split('.');
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'xlsm'];
    if(allowedExtensions.includes(extension[extension.length-1])) return true
    return false;
  }
  checkFileSize(file:File):boolean{
    if(file.size<10*1024*1024) return true; // ako je manje od 10mb moze da uploaduje
    return false;
  }
  isSelectedFileImage(file:File):boolean{
    var extension = file.name.split('.');
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    if(allowedExtensions.includes(extension[extension.length-1])) return true;
    return false;
  }
}