import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import * as Chart from 'chart.js';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import {ApiService} from "../../../../services/api/api.service";
import {Site} from "../../../../interfaces";
import { AuthService } from 'src/app/services/auth/auth.service';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

// @ts-ignore: Object is possibly 'null'.
export class HomeComponent implements OnInit, AfterViewInit {
  public dayChart: any;
  public sites: Site[] = [];
  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];

  public imageToShow: any;
  public isImageLoading: boolean = false;

  // @ts-ignore
  @ViewChild('title') detailsCardTitle: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('detailsCardAbsoluteTime') detailsCardAbsoluteTime: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('detailsCardPercent') detailsCardPercent: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('favicon') favicon: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('visits') visits: ElementRef<HTMLElement>;

  constructor(private apiService: ApiService, public authService: AuthService, private statisticsService: StatisticsService) { }

  async ngOnInit(){
    let currentTime = new Date();
    let millisecondsInDay = currentTime.getHours()*60*60*1000 + currentTime.getMinutes()*60*1000;
    let startOfDay = currentTime.getTime() - millisecondsInDay;
    this.statisticsService.getDougnutChart(startOfDay, currentTime.getTime(), (chart: any, sites: any) => {
      this.dayChart = chart;
      this.sites = sites;
    });
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    const hovered : any = active[0];
    let site = this.sites[hovered._index];

    this.detailsCardTitle.nativeElement.innerHTML = site.url;
    this.detailsCardAbsoluteTime.nativeElement.innerHTML = site.prettyTime;
    this.detailsCardPercent.nativeElement.innerHTML = site.percentage.toString() + "%";
    this.favicon.nativeElement.setAttribute("src", site.favicon);
    this.visits.nativeElement.innerHTML = "Visits: " + site.visits.toString();
  }

  convertMilliseconds(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }

  register() {
    this.authService.sendRegisterRequest();
  }

  login(){
    this.authService.sendLoginRequest();
  }
}
