import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public loggedIn: boolean;

  constructor(public router: Router) {
    this.loggedIn = true;
  }

  ngOnInit(): void {
  }

}
