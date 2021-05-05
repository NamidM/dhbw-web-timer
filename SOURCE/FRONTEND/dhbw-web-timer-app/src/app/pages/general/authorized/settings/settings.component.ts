import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DeleteDialogComponent } from 'src/app/shared/dialogs/delete-dialog/delete-dialog.component';
import { UpdateDialogComponent } from 'src/app/shared/dialogs/update-dialog/update-dialog.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  constructor(public authService: AuthService, public dialog: MatDialog) {}

  ngOnInit(): void {
  }

  openDeleteDialog() {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: {message: 'Wollen Sie Ihr Konto wirklich löschen?'}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.authService.deleteUser();
      }
    });
  }

  changeUsername() {
    const dialogRef = this.dialog.open(UpdateDialogComponent, {
      width: '300px',
      data: {username: this.authService.username}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.authService.updateUser(result);
      }
    });
  }
}
