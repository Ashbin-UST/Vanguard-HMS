import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HtmlContentService {

  api = 'http://localhost:5000/api/html';

  constructor(private http: HttpClient) {}

  getContent() {
    return this.http.get<any[]>(this.api);
  }
}