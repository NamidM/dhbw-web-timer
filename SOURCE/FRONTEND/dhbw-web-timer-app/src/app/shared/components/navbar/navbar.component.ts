import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(public router: Router, public authService: AuthService, private snackBarService: SnackBarService) {
  }

  ngOnInit(): void {
  }
  logout() {
    this.authService.logout();
    this.snackBarService.openSnackbarSuccess("Ausgeloggt!");
    this.router.navigateByUrl("/");
  }
}
