import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef , MAT_DIALOG_DATA} from '@angular/material/dialog';
import { SettingsComponent } from 'src/app/pages/general/authorized/settings/settings.component';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss']
})
export class UpdateDialogComponent implements OnInit {
  public updateForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<SettingsComponent>, private formBuilder: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.updateForm = this.formBuilder.group({
      username: [null, [Validators.required, Validators.pattern("[a-zA-Z0-9_-]{3,16}$")]]
    });
    this.updateForm.controls.username.setValue(this.data.username);
  }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(this.updateForm.controls.username.value);
  }

}