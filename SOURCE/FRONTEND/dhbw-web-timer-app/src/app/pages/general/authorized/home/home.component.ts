import { Component, OnInit } from '@angular/core';
import { Site } from "../../../../interfaces";
import { AuthService } from 'src/app/services/auth/auth.service';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';
import { MatDialog } from '@angular/material/dialog';
import { PostDialogComponent } from 'src/app/shared/dialogs/post-dialog/post-dialog.component';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  public dayChart: any;
  public sites: Site[] = [];
  public site: any;
  public loading: boolean = true;
  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];
  public generalInformation: any;
  public extension_link: any = environment.extension_link;
  public loginFailed: any = history.state.loginFailed;
  public registerFailed: any = history.state.registerFailed;

  constructor(public authService: AuthService, private statisticsService: StatisticsService, private dialog: MatDialog, private router: Router) { }

  async ngOnInit(){
    let currentTime = new Date();
    let millisecondsInDay = currentTime.getHours()*60*60*1000 + currentTime.getMinutes()*60*1000;
    let startOfDay = currentTime.getTime() - millisecondsInDay;
    this.statisticsService.getDonutChart(startOfDay, currentTime.getTime(), (chart: any, sites: any, allData:any, generalInformation: any) => {
      this.dayChart = chart;
      this.sites = sites;
      this.site = generalInformation;
      this.generalInformation = generalInformation;
      this.loading = false;
    });
  }
  /* Event that is triggered when the user hovers over the chart */
  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    const hovered : any = active[0];
    this.site = this.sites[hovered._index];
  }
  /* Function that is opened when user clicks on "Post" button */
  postStatistics() {
    this.dialog.open(PostDialogComponent, {
      width: '70vw',
      height: '75vh',
      data: {sites: this.sites, type: 'daily', startTime: new Date()}
    });
  }

  onImgError(event: any){
    event.target.src = '/assets/images/defaultFavicon.png';
  }
}
