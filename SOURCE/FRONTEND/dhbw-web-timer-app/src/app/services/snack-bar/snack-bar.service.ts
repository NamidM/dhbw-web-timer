import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor(private snackbar: MatSnackBar) {}
  
  /** Open a snack bar with success styling */
  openSnackbarSuccess(message: string) {
    this.openSnackBar(
      message,
      'mat-snackbar-success'
    );
  }

  /** Open a snack bar with error styling */
  openSnackbarError(message: string) {
    this.openSnackBar(
      message,
      'mat-snackbar-error'
    );
  }

  /** Open a snack bar with default style and settings */
  openSnackBar(message: string, pannelClass: string) {
    this.snackbar.open(message, "Ok", {
      duration: 3000,
      panelClass: [pannelClass],
    });
  }
}