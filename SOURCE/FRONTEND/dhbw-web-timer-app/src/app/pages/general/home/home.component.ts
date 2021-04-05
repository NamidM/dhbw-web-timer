import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import {ApiService} from "../../../services/api/api.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  constructor(private snackService: SnackBarService, private apiService: ApiService) { }

  public experienceChart: any;
  public siteNames: string[] = [];
  public times: number[] = [];

  async ngOnInit(){
    this.grabWebActivityData();
  }

  grabWebActivityData(){
    let date = new Date();
    let currentTime = Date.now();
    let millisecondsInDay = date.getHours()*60*60*1000 + date.getMinutes()*60*1000;

    let startOfDay = currentTime - millisecondsInDay;

    console.log()

    this.apiService.getWebActivitiesInTimespan('0', startOfDay.toString(), currentTime.toString()).subscribe((timespanData : any) => {
      let sites = new Map<string, number>();
      sites.clear();

      for(let entry of timespanData){

        let baseUrl = entry.url.split('/')[2];
        let timespan = entry.endtime - entry.starttime;

        if(sites.get(baseUrl) != null){
          let oldTime = sites.get(baseUrl);
          // @ts-ignore
          sites.set(baseUrl, oldTime + timespan);
        }
        else {
          sites.set(baseUrl, timespan);
        }
      }

      for(var[siteName, time] of sites.entries()){
        this.siteNames.push(siteName);
        this.times.push(time);
      }

      console.log(this.siteNames);
      console.log(this.times);

      this.createDoughnut();
    });

  }

  test(){
    this.snackService.openSnackBar("test", "Ok");
  }

  createDoughnut(){
    this.experienceChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        scales: {yAxes: [{ticks: {beginAtZero: true}}]}},
      labels: this.siteNames,
      type: 'doughnut',
      legend: true,
      data: [
        {data: this.times, label: 'times'},
      ],
    }
  }
}



