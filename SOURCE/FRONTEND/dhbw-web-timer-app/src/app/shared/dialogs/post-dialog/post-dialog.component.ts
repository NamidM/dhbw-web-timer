import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HomeComponent } from 'src/app/pages/general/authorized/home/home.component';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';

@Component({
  selector: 'app-post-dialog',
  templateUrl: './post-dialog.component.html',
  styleUrls: ['./post-dialog.component.scss']
})
export class PostDialogComponent implements OnInit {

  public postChart: any;
  public postForm: any;
  public site: any;

  constructor(private dialogRef: MatDialogRef<HomeComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private statisticsService: StatisticsService, private formBuilder: FormBuilder, private apiService: ApiService, private snackService: SnackBarService, private authService: AuthService, private router: Router) {
    switch(this.data.type) {
      case 'daily':
        this.statisticsService.showDoughnutChart(this.data.sites, (chart: any)=>{
          this.postChart = chart;
        }); 
        break;
      case 'total':
        this.statisticsService.showDoughnutChart(this.data.sites, (chart: any)=>{
          this.postChart = chart;
        }); 
        break;
      case 'weekly':
        this.statisticsService.showBarChart(this.data.sites, (chart: any)=>{
          this.postChart = chart;
        }); 
        break;
      case 'monthly':
        this.statisticsService.showLineChart(this.data.sites, (chart: any)=>{
          this.postChart = chart;
        }); 
        break;
    }
    this.site = this.data.sites[0];
    this.postForm = this.formBuilder.group({
      title: [null, [Validators.required]],
      content: [null, [Validators.required]],
      sites: [null, [Validators.required]]
    });
    this.postForm.controls.sites.setValue(this.data.sites);
  }

  ngOnInit(): void {
    this.authService.silentLogin(()=>{});
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    const hovered : any = active[0];
    this.site = this.data.sites[hovered._index];
  }

  post() {
    this.apiService.postStatistics(this.postForm.controls.title.value, this.postForm.controls.content.value, this.data.type, this.data.sites, this.data.startTime).subscribe((response)=>{
      if(response.message == "success") {
        this.snackService.openSnackbarSuccess("Post erfolgreich hochgeladen");
        this.router.navigateByUrl("/community");
      } else {
        this.snackService.openSnackbarError("Fehler beim hochladen");
      }
      this.dialogRef.close(response);
    });
  }
}