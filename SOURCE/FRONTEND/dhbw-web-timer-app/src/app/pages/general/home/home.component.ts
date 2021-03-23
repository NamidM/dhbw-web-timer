import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private snackService: SnackBarService) { }

  ngOnInit(): void {
  }

  test(){
    this.snackService.openSnackBar("test", "Ok");
  }

}
