import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public loading: boolean = true;
  constructor(public authService: AuthService, private router: Router, private apiService: ApiService, private snackBarService: SnackBarService) { }

  ngOnInit(): void {
    /* Get tokens from url */
    let id_token = this.router.url.substring(this.router.url.indexOf('id_token=') + 9)
    id_token = id_token.substring(0, id_token.indexOf('&'));

    let authorization_code = this.router.url.substring(this.router.url.indexOf('code=') + 5);
    authorization_code = authorization_code.substring(0, authorization_code.indexOf('&'));
    this.router.navigateByUrl("/login");
    if(id_token == "" || authorization_code == "") {
      /* No code was given -> Redirect to home */
      this.router.navigateByUrl("/");
    } else {
      this.apiService.login(id_token, authorization_code).subscribe((response)=>{
        if(response.message == "success") {
          this.authService.loginUser(response.username);
          this.snackBarService.openSnackbarSuccess("Eingeloggt!");
          this.router.navigateByUrl("/");
        } else {
          this.snackBarService.openSnackbarError("Fehler: Account ist nicht registriert!");
          this.router.navigate(["/"], {state: {loginFailed: true}});
          this.loading = false;
        }
      });
    }
  }

  register() {
    this.authService.sendRegisterRequest();
  }
}
