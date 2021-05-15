import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ApiService } from '../api/api.service';
import { SnackBarService } from '../snack-bar/snack-bar.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loading: boolean = true;
  public username?: string;

  constructor(private apiService: ApiService, private router: Router, private snackBarService: SnackBarService) {}

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
        this.router.navigateByUrl("/");
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
        let authorizedSites = ["/home", "/settings", "/statistics", "/community"];
        if(authorizedSites.includes(this.router.url)) {
          this.router.navigateByUrl("/");
        }
        delete(this.username);
      }
    });
  }

  deleteUser() {
    this.apiService.deleteUser().subscribe((response)=>{
      if(response.message == "success") {
        this.logout();
        this.snackBarService.openSnackbarSuccess("Account erfolgreich gelöscht!");
      }
    });
  }

  updateUser(username: any) {
    this.apiService.updateUser(username).subscribe((response)=>{
      if(response.message == "success") {
        this.username = response.username;
        this.snackBarService.openSnackbarSuccess("Benutzername erfolgreich geändert");
      } else {
        this.snackBarService.openSnackbarError("Benutzername bereits vergeben");
      }
    });
  }
}