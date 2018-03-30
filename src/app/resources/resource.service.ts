import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';

import { Resource } from '../models/resource.model';

@Injectable()
export class ResourceService {

  constructor(private http: HttpClient) { }

  /* Get all resources */
  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>('/api/resources/');
  }

  /* Get specified resource */
  getResource(resourceId): Observable<Resource> {
    return this.http.get<Resource>('/api/resource/' + resourceId);
  }

  /* Create a file for a specific resource */
  createFile(resourceId: string) {
    const body = JSON.stringify({message: 'PRS resource'});
    return this.http.post('/api/resource/' + resourceId + '/files', body, {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      responseType: 'text'
    });
  }

  /* Create new resource */
  createResource(title: string): Observable<Resource> {
    const header = { headers: new HttpHeaders({ 'Content-Type': 'application/json'})};
    const body = JSON.stringify({'title': title});
    return this.http.post<Resource>('/api/resource', body, header);
  }

  /* Delete a resource */
  deleteResource(id) {
    return this.http.delete('/api/resource/' + id, {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      responseType: 'text'
    });
  }

  downloadAllResources() {

  }

  downloadResources(ids) {

  }

  uploadFile(resourceId: string, fileId: string, file: File) {
    const fileUpload = new FormData();
    fileUpload.append('file', file);

    return this.http.post('/api/resource/' + resourceId + '/files/' + fileId + '/file',
      fileUpload, { responseType: 'text' });
  }

}
