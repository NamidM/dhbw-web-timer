import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ApiService } from '../api/api.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loading: boolean = true;
  public username?: string;

  constructor(private cookieService: CookieService, private apiService: ApiService, private router: Router) {}

  sendRegisterRequest(){
    this.apiService.getOAuthUrl("register").subscribe((response)=>{
      window.location.href = response.url;
    });
  }

  sendLoginRequest(){
    this.apiService.getOAuthUrl("login").subscribe((response)=>{
      window.location.href = response.url;
    });
  }

  logout() {
    this.apiService.logout().subscribe((response)=> {
      if(response.message == "success") {
        delete(this.username);
      }
    });
  }

  loginUser(username?: string) {
    this.loading = false;
    this.username = username;
  }

  silentLogin(callback: Function) {
    this.apiService.silentLogin().subscribe((response)=>{
      this.loading = false;
      if(response.message == "success") {
        this.username = response.username;
        callback();
      } else {
        delete(this.username);
      }
    });
  }

}
