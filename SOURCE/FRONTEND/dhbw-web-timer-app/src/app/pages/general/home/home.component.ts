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



  async ngOnInit(){
    let data = await this.apiService.getTest();
    //console.log(data);

    this.createDoughnut();
    this.grabWebActivityData();
  }

  grabWebActivityData(){
    let date = new Date();
    let currentTime = Date.now();
    let millisecondsInDay = date.getHours()*60*60*1000 + date.getMinutes()*60*1000;

    let startOfDay = currentTime - millisecondsInDay;

    console.log()

    this.apiService.getWebActivitiesInTimespan('0', startOfDay.toString(), currentTime.toString()).subscribe((timespanData : any) => {
      console.log("Timespandata inc:");
      console.log(timespanData);

      let sites = [];

      for(let entry of timespanData){

        console.log(entry.url.split('/')[2]);

        //if baseurl schon vorhanden -> aufaddieren
        //sonst neu anlegen




        sites.push({
          baseUrl: entry.url.split('/')[2],
          time: entry.endtime - entry.starttime
        });


      }
    });
  }

  test(){
    this.snackService.openSnackBar("test", "Ok");
  }

  createDoughnut(){
    let experience = Math.floor(100 / 55 * 69);
    this.experienceChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        scales: {yAxes: [{ticks: {beginAtZero: true}}]}},
      labels: ['Probanden mit Vorerfahrung (%)', 'Probanden ohne Vorerfahrung (%)'],
      type: 'doughnut',
      legend: true,
      data: [
        {data: [experience, 100-experience], label: 'Prozent'},
      ],
    }
  }
}



