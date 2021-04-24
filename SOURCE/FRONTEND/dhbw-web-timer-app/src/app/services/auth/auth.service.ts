import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { ApiService } from '../api/api.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loggedIn: boolean = false;

  constructor(private cookieService: CookieService, private apiService: ApiService) {}

  sendRegisterRequest(){
    this.apiService.getOAuthUrl("register").subscribe((response)=>{
      location.replace(response.url);
    });
  }

  sendLoginRequest(){
    this.apiService.getOAuthUrl("login").subscribe((response)=>{
      location.replace(response.url);
    });
  }

  logout() {
    this.apiService.logout().subscribe((response)=> {
      if(response.message == "success") {
        this.loggedIn = false;
      }
    });
  }

  loginUser() {
    this.loggedIn = true;
  }

}
