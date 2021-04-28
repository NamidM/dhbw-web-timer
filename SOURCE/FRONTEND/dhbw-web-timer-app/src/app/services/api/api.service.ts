import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }

  private readonly defaultOptions: any = {
    headers: new HttpHeaders().set('Content-Type', 'application/json')
  }

  silentLogin() {
    return this.http.get<{ message: 'success' | 'error', username?: string}>(`${this.baseUrl}silentLogin`, { withCredentials: true });
  }

  login(id_token: string, authorization_code: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    return this.http.get<{ message: 'success' | 'error', username?: string}>(`${this.baseUrl}login`, { params: params, withCredentials: true });
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
    return this.http.get<{ message: 'success' | 'error', username?: string}>(`${this.baseUrl}register`, { params: params, withCredentials: true });
  }

  deleteUser() {
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}user`, {withCredentials: true});
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
}
