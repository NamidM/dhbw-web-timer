import { Component, OnInit } from '@angular/core';
import { Site } from "../../../../interfaces";
import { AuthService } from 'src/app/services/auth/auth.service';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';
import { MatDialog } from '@angular/material/dialog';
import { PostDialogComponent } from 'src/app/shared/dialogs/post-dialog/post-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  public dayChart: any;
  public sites: Site[] = [];
  public site: any;
  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];
  public generalInformation: any;


  public imageToShow: any;
  public isImageLoading: boolean = false;

  constructor(public authService: AuthService, private statisticsService: StatisticsService, private dialog: MatDialog, private router: Router) { }

  async ngOnInit(){
    let currentTime = new Date();
    let millisecondsInDay = currentTime.getHours()*60*60*1000 + currentTime.getMinutes()*60*1000;
    let startOfDay = currentTime.getTime() - millisecondsInDay;
    this.statisticsService.getDougnutChart(startOfDay, currentTime.getTime(), (chart: any, sites: any) => {
      this.dayChart = chart;
      this.sites = sites;
      this.site = sites[0];
      this.createGeneralInformation();
    });
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    const hovered : any = active[0];
    this.site = this.sites[hovered._index];
  }

  postStatistics() {
    this.dialog.open(PostDialogComponent, {
      width: '70vw',
      height: '75vh',
      data: {sites: this.sites, type: 'daily', startTime: new Date()}
    });
  }
  public createGeneralInformation(){

    this.generalInformation = {};

    let totalTime = 0;
    let totalVisits = 0;

    for(let i=0; i<this.sites.length; i++){
      totalTime += this.sites[i].time;
      totalVisits += this.sites[i].visits;
    }

    this.generalInformation.url = "Gesamtdaten:";
    this.generalInformation.favicon = "/assets/images/logo.png"
    this.generalInformation.prettyTime = this.getPrettyTime(totalTime);
    this.generalInformation.percentage = "100%";
    this.generalInformation.visits = totalVisits;
  }

  getPrettyTime(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }
}
