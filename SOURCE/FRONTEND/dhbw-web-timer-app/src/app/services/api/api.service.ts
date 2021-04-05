import {HttpClient, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }

  getData(){
    return this.http.get(`${this.baseUrl}test`);
  }

  getTest(){
    return this.http.get(`${this.baseUrl}test`);
  }

  getWebActivitiesInTimespan(userID: string, startTime: string, endTime: string ){
    let params = new HttpParams();
    params = params.append('userID', userID);
    params = params.append('startTime', startTime);
    params = params.append('endTime', endTime);

    return this.http.get(`${this.baseUrl}webActivities`, { params: params });
  }
}
