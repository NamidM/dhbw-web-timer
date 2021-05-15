import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private id_token: string = "";
  private authorization_code: string = "";
  public loading: boolean = true;
  registerForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private apiService: ApiService, private snackBarService: SnackBarService) {
    this.registerForm = this.formBuilder.group({
      username: [null, [Validators.required, Validators.pattern("[a-zA-Z0-9_-]{3,16}$")]]
    });
  }

  ngOnInit(): void {
    /* Get tokens from url */
    this.id_token = this.router.url.substring(this.router.url.indexOf('id_token=') + 9)
    this.id_token = this.id_token.substring(0, this.id_token.indexOf('&'));

    this.authorization_code = this.router.url.substring(this.router.url.indexOf('code=') + 5);
    this.authorization_code = this.authorization_code.substring(0, this.authorization_code.indexOf('&'));
    this.router.navigateByUrl("/register");
    if(this.id_token == "" || this.authorization_code == "" || this.authService.username) {
      /* If no token was given -> Redirect to home */
      this.router.navigateByUrl("/");
    } else {
      this.apiService.registerCheck(this.id_token).subscribe((response)=>{
        this.loading = false;
        if(response.message != "success") {
          this.router.navigate(["/"], {state: {registerFailed: true}});
        }
      });
    }
  }

  register() {
    this.apiService.register(this.id_token, this.authorization_code, this.registerForm.controls['username'].value).subscribe((response)=>{
      if(response.message == "success") {
        this.authService.loginUser(response.username);
        this.snackBarService.openSnackbarSuccess("Registriert!");
        this.router.navigateByUrl("/");
      } else if(response.nameTaken) {
        this.snackBarService.openSnackbarError("Benutzername bereits vergeben!");
      } else {
        this.router.navigate(["/"], {state: {registerFailed: true}});
      }
    });
  }
}