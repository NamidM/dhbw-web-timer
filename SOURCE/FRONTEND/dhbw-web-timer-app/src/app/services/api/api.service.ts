import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }

  silentLogin() {
    return this.http.get<{ message: 'success' | 'error', username?: string, userID?: string}>(`${this.baseUrl}silentLogin`, { withCredentials: true });
  }

  login(id_token: string, authorization_code: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    return this.http.get<{ message: 'success' | 'error', username?: string, userID?: string}>(`${this.baseUrl}login`, { params: params, withCredentials: true });
  }

  logout() {
    return this.http.get<{ message: 'success' | 'error'}>(`${this.baseUrl}logout`, { withCredentials: true });
  }

  registerCheck(id_token: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    return this.http.get<{ message: 'success' | 'error', userID: string }>(`${this.baseUrl}registerCheck`, { params: params });
  }

  register(id_token: string, authorization_code: string, username: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    params = params.append('username', username);
    return this.http.get<{ message: 'success' | 'error', username?: string, userID?: string}>(`${this.baseUrl}register`, { params: params, withCredentials: true });
  }

  deleteUser() {
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}user`, {withCredentials: true});
  }

  deletePost(_id: any) {
    let params = new HttpParams();
    params = params.append('_id', _id);
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}post`, 
    {withCredentials: true, params: params, headers: new HttpHeaders().set('Content-Type', 'application/json')});
  }

  updateUser(username: string) {
    return this.http.put<{ message: 'success' | 'error', username: string }>(`${this.baseUrl}user`,{username: username}, 
    { withCredentials: true, headers: new HttpHeaders().set('Content-Type', 'application/json')});
  }

  getOAuthUrl(redirect: 'login' | 'register') {
    let params = new HttpParams();
    params = params.append('redirect', redirect);
    return this.http.get<{url: string}>(`${this.baseUrl}getOAuthUrl`, { params: params });
  }

  getWebActivitiesInTimespan(startTime: string, endTime: string ){
    let params = new HttpParams();
    params = params.append('startTime', startTime);
    params = params.append('endTime', endTime);

    return this.http.get(`${this.baseUrl}webActivities`, { params: params, withCredentials: true});
  }

  postStatistics(title: string, content: string, type: 'daily' | 'weekly' | 'monthly' | 'total', sites: any[], startTime: any) {
    if(type == 'weekly' || type == 'monthly') {
      for(let i = 0; i<sites.length; i++) {
        sites[i] = {
          data: sites[i].data,
          stack: sites[i].stack,
          label: sites[i].label
        }
      }
    }
    let params = new HttpParams();
    params = params.append('title', title);
    params = params.append('content', content);
    params = params.append('type', type);
    params = params.append('sites', JSON.stringify(sites));
    if(startTime) {
      params = params.append('startTime', startTime.toString());
    }

    return this.http.get<{message: 'success' | 'error'}>(`${this.baseUrl}post`, 
    { params: params, withCredentials: true});
  }

  getAllPosts() {
    return this.http.get<{message: 'success' | 'error', posts: any}>(`${this.baseUrl}allPosts`, { withCredentials: true});
  }
}
