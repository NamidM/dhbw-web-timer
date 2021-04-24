import {HttpClient, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }

  silentLogin() {
    return this.http.get<{ message: 'success' | 'error'}>(`${this.baseUrl}silentLogin`, { withCredentials: true });
  }

  login(id_token: string, authorization_code: string) {
    let params = new HttpParams();
    params = params.append('id_token', id_token);
    params = params.append('authorization_code', authorization_code);
    return this.http.get<{ message: 'success' | 'error'}>(`${this.baseUrl}login`, { params: params, withCredentials: true });
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
    return this.http.get<{ message: 'success' | 'error'}>(`${this.baseUrl}register`, { params: params, withCredentials: true });
  }

  deleteUser() {
    return this.http.delete<{ message: 'success' | 'error' }>(`${this.baseUrl}user`, {withCredentials: true});
  }

  refreshToken() {
    let params = new HttpParams();
    params = params.append('code', '4/0AY0e-g6E68EFjrkja2fYdwzfhQIYDEdM8bYhRwJJIvbsKj1cYIaf0ThU9_rqiLqXuo-4z');
    params = params.append('client_secret', '1btnV7iZumXkSjLiJ1GoEjHM');
    params = params.append('client_id', '13816586294-mrtld51khmjj2lk85v2n12au2fnsak8c.apps.googleusercontent.com');
    params = params.append('grant_type', 'authorization_code');
    params = params.append('redirect_uri', 'https%3A//localhost:4200.com/login&');
    console.log(params);
    return this.http.post(`https://oauth2.googleapis.com/token`, { params: params, withCredentials: true });
  }

  getOAuthUrl(redirect: 'login' | 'register') {
    let params = new HttpParams();
    params = params.append('redirect', redirect);
    return this.http.get<{url: string}>(`${this.baseUrl}getOAuthUrl`, { params: params });
  }

  getData(){
    return this.http.get(`${this.baseUrl}test`, {withCredentials: true});
  }

  getTest(){
    return this.http.get(`${this.baseUrl}test`, {withCredentials: true});
  }

  getWebActivitiesInTimespan(userID: string, startTime: string, endTime: string ){
    let params = new HttpParams();
    params = params.append('userID', userID);
    params = params.append('startTime', startTime);
    params = params.append('endTime', endTime);

    return this.http.get(`${this.baseUrl}webActivities`, { params: params, withCredentials: true});
  }
}
