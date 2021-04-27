import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import * as Chart from 'chart.js';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import {ApiService} from "../../../services/api/api.service";
import {Site} from "../../../interfaces";
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

// @ts-ignore: Object is possibly 'null'.
export class HomeComponent implements OnInit {

  public dayChart: any;
  public siteNames: string[] = [];
  public times: number[] = [];
  public sites: Site[] = [];

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
          sites.push({url: baseUrl, time: timespan, favicon: entry.faviconUrl, percentage: 0, visits: 0});
        } else{
          sites[index].time += timespan;
          sites[index].visits++;
        }
      }

      sites.sort((a: any, b: any)=>{
        return b.time-a.time;
      });
      if(sites.length > 10) {
        let others = {url: "Andere", time: 0, visits: 0 };
        for(let j = 9; j < sites.length; j++) {
          others.time += sites[j].time;
          others.visits++;
        }
        sites.splice(9, 0, others);
        sites.splice(10, sites.length-1);
      }
      sites = this.setPercentage(sites);
      for(let i=0; i<sites.length; i++){
        this.siteNames.push(sites[i].url);
        this.times.push(Math.round(sites[i].time/1000/6)/10);
      }

      this.sites = sites;
      this.createDoughnut();
    });
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    const hovered : any = active[0];
    let site = this.sites[hovered._index];
    let timeString = this.convertMilliseconds(site.time);

    this.detailsCardTitle.nativeElement.innerHTML = site.url;
    this.detailsCardAbsoluteTime.nativeElement.innerHTML = timeString;
    this.detailsCardPercent.nativeElement.innerHTML = site.percentage.toString() + "%";
    this.favicon.nativeElement.setAttribute("src", site.favicon);
    this.visits.nativeElement.innerHTML = "Visits: " + site.visits.toString();
  }

  createDoughnut(){
    this.dayChart = {
       options: {
        tooltips: {
          enabled: false
        },
        scales: {yAxes: [{ticks: {beginAtZero: true}, scaleLabel: {
          display: true,
          labelString: 'Minuten'
        }}]},
        responsive: true,
        plugins:{
          tooltip: {
            callbacks: {
              // @ts-ignore
              label: function(context){
                console.log(context);
                return "hallo";
              }
            }
          }
        }
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
      if(site.url.localeCompare(url) == 0){
        return i;
      }
    }
    return -1;
  }

  setPercentage(sites: any[]){
    let completeTime: number = 0;

    for(let i=0; i<sites.length; i++){
      completeTime += sites[i].time;
      console.log(sites[i].time);
    }

    for(let i=0; i<sites.length; i++){
      let percent = (sites[i].time/completeTime) * 100;
      let rounded =  Math.round(percent * 10) / 10;
      sites[i].percentage = rounded;
    }

    return sites;
  }

  register() {
    this.authService.sendRegisterRequest();
  }

  login(){
    this.authService.sendLoginRequest();
  }

  deleteUser() {
    if(this.authService.username) {
      this.apiService.deleteUser().subscribe((response)=>{
        if(response.message == "success") {
          this.authService.logout();
        }
      })
    }
  }
}



