import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor(private snackbar: MatSnackBar) {}

  openSnackBar(message:string, action:string) {
    this.snackbar.open(message, action, {duration: 2000});
  }
}
