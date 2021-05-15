import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }
  /* Function to make REST API call to check if user is already logged in */
  silentLogin() {
    return this.http.get<{ message: 'success' | 'error', username?: string, userID?: string}>(`${this.baseUrl}silentLogin`, { withCredentials: true });
  }
  /* Function to make REST API call to log user in */
  login(id_token: string, authorization_code: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    return this.http.get<{ message: 'success' | 'error', username?: string, userID?: string}>(`${this.baseUrl}login`, { params: params, withCredentials: true });
  }
  /* Function to make REST API call to log user out */
  logout() {
    return this.http.get<{ message: 'success' | 'error'}>(`${this.baseUrl}logout`, { withCredentials: true });
  }
  /* Function to make REST API call to check if user with googleID is registered */
  registerCheck(id_token: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    return this.http.get<{ message: 'success' | 'error', userID: string }>(`${this.baseUrl}registerCheck`, { params: params });
  }
  /* Function to make REST API call to register user */
  register(id_token: string, authorization_code: string, username: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    params = params.append('username', username);
    return this.http.get<{ message: 'success' | 'error', nameTaken?: boolean, username?: string, userID?: string}>(`${this.baseUrl}register`, { params: params, withCredentials: true });
  }
  /* Function to make REST API call to delete user */
  deleteUser() {
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}user`, {withCredentials: true});
  }
  /* Function to make REST API call to delete post */
  deletePost(_id: any) {
    let params = new HttpParams();
    params = params.append('_id', _id);
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}post`, 
    {withCredentials: true, params: params, headers: new HttpHeaders().set('Content-Type', 'application/json')});
  }
  /* Function to make REST API call to update username */
  updateUser(username: string) {
    return this.http.put<{ message: 'success' | 'error', username: string }>(`${this.baseUrl}user`,{username: username}, 
    { withCredentials: true, headers: new HttpHeaders().set('Content-Type', 'application/json')});
  }
  /* Function to make REST API call to getOAuthUrl */
  getOAuthUrl(redirect: 'login' | 'register') {
    let params = new HttpParams();
    params = params.append('redirect', redirect);
    return this.http.get<{url: string}>(`${this.baseUrl}getOAuthUrl`, { params: params });
  }
  /* Function to make REST API call to get tracking data in a timespan */
  getWebActivitiesInTimespan(startTime: string, endTime: string ){
    let params = new HttpParams();
    params = params.append('startTime', startTime);
    params = params.append('endTime', endTime);
    return this.http.get<{webActivities?: any}>(`${this.baseUrl}webActivities`, { params: params, withCredentials: true});
  }
  /* Function to make REST API call to post a statistics */
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
    if(startTime) {
      startTime = startTime.toString();
    }
    const body = { title, content, type, sites, startTime }
    return this.http.post<{message: 'success' | 'error'}>(`${this.baseUrl}post`, 
    body , { withCredentials: true, headers: new HttpHeaders().set('Content-Type', 'application/json') });
  }
  /* Function to make REST API call to get all posts */
  getAllPosts() {
    return this.http.get<{message: 'success' | 'error', posts: any}>(`${this.baseUrl}allPosts`, { withCredentials: true});
  }
}