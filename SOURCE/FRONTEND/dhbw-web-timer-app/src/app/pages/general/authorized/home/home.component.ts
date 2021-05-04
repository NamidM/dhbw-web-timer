import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import * as Chart from 'chart.js';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import {ApiService} from "../../../../services/api/api.service";
import {Site} from "../../../../interfaces";
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

// @ts-ignore: Object is possibly 'null'.
export class HomeComponent implements OnInit, AfterViewInit {

  public dayChart: any;
  public siteNames: string[] = [];
  public times: number[] = [];
  public sites: Site[] = [];
  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];
  public generalInformation: any;

  public lastHoveredTimestamp = 0;


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

  constructor(private snackService: SnackBarService, private apiService: ApiService, public authService: AuthService) { }

  async ngOnInit(){
    this.grabWebActivityData();
  }

  grabWebActivityData(){
    let date = new Date();
    let currentTime = Date.now();
    let millisecondsInDay = date.getHours()*60*60*1000 + date.getMinutes()*60*1000;

    let startOfDay = currentTime - millisecondsInDay;

    this.apiService.getWebActivitiesInTimespan(startOfDay.toString(), currentTime.toString()).subscribe((timespanData : any) => {
      let sites: any[] = []

      for(let entry of timespanData){
        let baseUrl:string = entry.url.split('/')[2];
        let timespan:number = entry.endtime - entry.starttime;
        let index = this.findIndexOfSiteWithURL(sites, baseUrl);

        if(index == -1){
          sites.push({url: baseUrl, time: timespan, favicon: entry.faviconUrl, percentage: 0, visits: 1, prettyTime: ""});
        } else{
          sites[index].time += timespan;
          sites[index].visits++;

          if(sites[index].favicon.startsWith("chrome://") && !entry.faviconUrl.startsWith("chrome://")){
            sites[index].favicon = entry.faviconUrl;
          }
        }
      }

      sites.sort((a: any, b: any)=>{
        return b.time-a.time;
      });
      if(sites.length > 10) {
        let others = {url: "Andere", time: 0, visits: 0, favicon: "/assets/defaultFavicon.png" };
        for(let j = 9; j < sites.length; j++) {
          others.time += sites[j].time;
          others.visits++;
        }
        sites.splice(9, 0, others);
        sites.splice(10, sites.length-1);
      }

      sites = this.setPercentage(sites);
      sites = this.setPrettyTime(sites);

      for(let i=0; i<sites.length; i++){
        this.siteNames.push(sites[i].url);
        this.times.push(sites[i].time);
      }
      this.sites = sites;

      this.createGeneralInformation();


      if(sites.length > 0) {
        this.createDoughnut();
      }

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
    this.generalInformation.prettyTime = this.convertMilliseconds(totalTime);
    this.generalInformation.percentage = "100%";
    this.generalInformation.visits = totalVisits;
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {

    const hovered : any = active[0];
    let site = this.sites[hovered._index];

    this.detailsCardTitle.nativeElement.innerHTML = site.url;
    this.detailsCardAbsoluteTime.nativeElement.innerHTML = site.prettyTime;
    this.detailsCardPercent.nativeElement.innerHTML = site.percentage.toString() + "%";
    this.favicon.nativeElement.setAttribute("src", site.favicon);
    this.visits.nativeElement.innerHTML = "Visits: " + site.visits.toString();

    //let currentTimestamp = Date.now();
    //console.log(currentTimestamp - this.lastHoveredTimestamp, active);
    //this.lastHoveredTimestamp = currentTimestamp;
  }

  createDoughnut(){
    this.dayChart = {
       options: {
        tooltips: {
          enabled: false
        },
        responsive: true
       },
      type: 'doughnut',
      legend: true,
      data: [
        {data: this.times, label: 'Time spent'},
      ],
      labels: this.siteNames
    }
  }

  convertMilliseconds(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }

  findIndexOfSiteWithURL(sites: any[], url: any){
    for(let i=0; i<sites.length; i++){
      let site = sites[i];

      if(typeof site.url !== "undefined" && site.url.localeCompare(url) == 0){
        return i;
      }
    }
    return -1;
  }

  setPercentage(sites: any[]){
    let completeTime: number = 0;

    for(let i=0; i<sites.length; i++){
      completeTime += sites[i].time;
    }

    for(let i=0; i<sites.length; i++){
      let percent = (sites[i].time/completeTime) * 100;
      let rounded =  Math.round(percent * 10) / 10;
      sites[i].percentage = rounded;
    }

    return sites;
  }

  setPrettyTime(sites: any[]){
    for(let i=0; i<sites.length; i++){
      sites[i].prettyTime = this.convertMilliseconds(sites[i].time);
    }
    return sites;
  }

  register() {
    this.authService.sendRegisterRequest();
  }

  login(){
    this.authService.sendLoginRequest();
  }
}
