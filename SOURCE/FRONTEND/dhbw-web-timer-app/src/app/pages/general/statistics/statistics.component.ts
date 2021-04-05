import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  public experienceChart: any;
  public weekChart: any;
  public siteNames: string[] = [];
  public times: number[] = [];
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });

  constructor(private apiService: ApiService) {
  }

  async ngOnInit(){    
    let currentDate = new Date();
    let startOfWeek = new Date();
    let endOfWeek = new Date();
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    this.updateWeekChart(startOfWeek, endOfWeek);
    this.updateDayChart(currentDate);
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

  dateSelectionDay(){
    console.log(this.range.controls["start"].value);
    this.updateDayChart(new Date(this.range.controls["start"].value));
  }

  startDateSelectionWeek(){
    let start = new Date(this.range.controls["start"].value);
    start.setDate(start.getDate() - start.getDay());
    this.range.controls["start"].setValue(start);
  }

  endDateSelectionWeek(){
    let start = new Date(this.range.controls["start"].value);
    let end = new Date(start);
    end.setDate(start.getDate() + 6); 
    this.range.controls["end"].setValue(end);
    this.updateWeekChart(start, end);
  }

  startDateSelectionMonth(){
    let start = new Date(this.range.controls["start"].value);
    start.setDate(1);
    this.range.controls["start"].setValue(start);
  }

  endDateSelectionMonth(){
    let start = new Date(this.range.controls["start"].value);
    let end = new Date(start.getUTCFullYear(), start.getMonth()+1, 0)
    this.range.controls["end"].setValue(end);
  }

  updateWeekChart(startOfWeek: Date, endOfWeek: Date) {
    this.apiService.getWebActivitiesInTimespan('0', startOfWeek.getTime().toString(), endOfWeek.getTime().toString()).subscribe((timespanData : any) => {
      let weekTime = [0,0,0,0,0,0,0];
      for(let e of timespanData) {
        let startTime = new Date(e.starttime);
        let endTime = new Date(parseInt(e.endtime));
        weekTime[startTime.getDay()] += (endTime.getTime() - startTime.getTime());
      }
      for(let i = 0; i<weekTime.length; i++){
        weekTime[i] = Math.floor(((weekTime[i]/1000)/6)/6)/100;
      }
      this.weekChart = {
        options: {
          responsive: true,
        },
        labels: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
        type: 'bar',
        legend: false,
        data: [
          { data: weekTime, label: 'Aktivität' }
        ],
      }
    });
  }

  updateDayChart(day: Date){
    this.times = [];
    this.siteNames = [];
    let millisecondsInDay = day.getHours()*60*60*1000 + day.getMinutes()*60*1000;
    let startOfDay = day.getTime() - millisecondsInDay;
    let endOfDay = startOfDay + 24*60*60*1000;
    this.apiService.getWebActivitiesInTimespan('0', startOfDay.toString(), endOfDay.toString()).subscribe((timespanData : any) => {
      let sites = new Map<string, number>();
      sites.clear();
      for(let entry of timespanData){
        let baseUrl = entry.url.split('/')[2];
        let timespan = entry.endtime - entry.starttime;
        if(sites.get(baseUrl) != null){
          let oldTime = sites.get(baseUrl);
          // @ts-ignore
          sites.set(baseUrl, oldTime + timespan);
        } else {
          sites.set(baseUrl, timespan);
        }
      }
      for(var[siteName, time] of sites.entries()){
        this.siteNames.push(siteName);
        this.times.push(time);
      }
      this.createDoughnut();
    });
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