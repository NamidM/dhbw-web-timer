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
  rangeWeek = new FormGroup({
    startWeek: new FormControl(),
    endWeek: new FormControl()
  });
  rangeDay = new FormGroup({
    startDay: new FormControl()
  });
  rangeMonth = new FormGroup({
    startMonth: new FormControl(),
    endMonth: new FormControl()
  });

  constructor(private apiService: ApiService) {
  }

  async ngOnInit(){    
    let currentDate = new Date();
    let startOfWeek = new Date();
    let endOfWeek = new Date();
    let startOfMonth = new Date();
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    startOfMonth.setDate(1);
    let endOfMonth = new Date(startOfMonth.getUTCFullYear(), startOfMonth.getMonth()+1, 0)
    this.rangeDay.controls["startDay"].setValue(new Date());
    this.rangeWeek.controls["startWeek"].setValue(startOfWeek);
    this.rangeWeek.controls["endWeek"].setValue(endOfWeek);
    this.rangeMonth.controls["startMonth"].setValue(startOfMonth);
    this.rangeMonth.controls["endMonth"].setValue(endOfMonth);

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
    this.updateDayChart(new Date(this.rangeDay.controls["startDay"].value));
  }

  startDateSelectionWeek(){
    let start = new Date(this.rangeWeek.controls["startWeek"].value);
    start.setDate(start.getDate() - start.getDay());
    this.rangeWeek.controls["startWeek"].setValue(start);
  }

  endDateSelectionWeek(){
    let start = new Date(this.rangeWeek.controls["startWeek"].value);
    let end = new Date(start);
    end.setDate(start.getDate() + 6); 
    this.rangeWeek.controls["endWeek"].setValue(end);
    this.updateWeekChart(start, end);
  }

  startDateSelectionMonth(){
    let start = new Date(this.rangeMonth.controls["startMonth"].value);
    start.setDate(1);
    this.rangeMonth.controls["startMonth"].setValue(start);
  }

  endDateSelectionMonth(){
    let start = new Date(this.rangeMonth.controls["startMonth"].value);
    let end = new Date(start.getUTCFullYear(), start.getMonth()+1, 0)
    this.rangeMonth.controls["endMonth"].setValue(end);
  }

  updateWeekChart(startOfWeek: Date, endOfWeek: Date) {
    this.apiService.getWebActivitiesInTimespan('0', startOfWeek.getTime().toString(), endOfWeek.getTime().toString()).subscribe((timespanData : any) => {
      let weekTime = [0,0,0,0,0,0,0];
      let startTime = new Date();
      for(let e of timespanData) {
        startTime.setTime(e.starttime);
        weekTime[startTime.getDay()] += (e.endtime - e.starttime);
      }
      console.log(weekTime)
      for(let i = 0; i<weekTime.length; i++){
        weekTime[i] = Math.floor(((weekTime[i]/1000))/6)/100;
      }     
      console.log(weekTime)
      this.weekChart = {
        options: {scaleShowVerticalLines: false,
          responsive: true,
          scales: {yAxes: [{ticks: {beginAtZero: true}}]}},
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
    let millisecondsInDay = day.getHours()*60*60*1000 + day.getMinutes()*60*1000 + day.getSeconds()*1000;
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

  nextDay() {
    let dayPlusOne = new Date(this.rangeDay.controls["startDay"].value);
    dayPlusOne.setTime(dayPlusOne.getTime()+24*60*60*1000);
    this.rangeDay.controls["startDay"].setValue(dayPlusOne);
    this.updateDayChart(dayPlusOne);
  }

  prevDay() {
    let dayMinusOne = new Date(this.rangeDay.controls["startDay"].value);
    dayMinusOne.setTime(dayMinusOne.getTime()-24*60*60*1000);
    this.rangeDay.controls["startDay"].setValue(dayMinusOne);
    this.updateDayChart(dayMinusOne);
  }

  nextWeek() {
    let weekPlusOne = new Date(this.rangeWeek.controls["startWeek"].value);
    weekPlusOne.setTime(weekPlusOne.getTime()+24*60*60*1000*7);
    this.rangeWeek.controls["startWeek"].setValue(weekPlusOne);
    let endWeekPlusOne = new Date(weekPlusOne);
    endWeekPlusOne.setDate(weekPlusOne.getDate() + 6);
    this.rangeWeek.controls["endWeek"].setValue(endWeekPlusOne);
    this.updateWeekChart(weekPlusOne, endWeekPlusOne);
  }

  prevWeek() {
    let weekMinusOne = new Date(this.rangeWeek.controls["startWeek"].value);
    weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
    this.rangeWeek.controls["startWeek"].setValue(weekMinusOne);
    let endWeekMinusOne = new Date(weekMinusOne)
    endWeekMinusOne.setDate(weekMinusOne.getDate() + 6);
    this.rangeWeek.controls["endWeek"].setValue(endWeekMinusOne);
    this.updateWeekChart(weekMinusOne, endWeekMinusOne);
  }

  nextMonth() {
    let monthPlusOne = new Date(this.rangeMonth.controls["startMonth"].value);
    monthPlusOne.setMonth(monthPlusOne.getMonth()+1);
    this.rangeMonth.controls["startMonth"].setValue(monthPlusOne);
    let endMonthPlusOne = new Date(monthPlusOne.getUTCFullYear(), monthPlusOne.getMonth()+1, 0)
    this.rangeMonth.controls["endMonth"].setValue(endMonthPlusOne);
    this.updateWeekChart(monthPlusOne, endMonthPlusOne);
  }

  prevMonth() {
    let monthMinusOne = new Date(this.rangeMonth.controls["startMonth"].value);
    monthMinusOne.setMonth(monthMinusOne.getMonth()-1);
    this.rangeMonth.controls["startMonth"].setValue(monthMinusOne);
    let endMonthMinusOne = new Date(monthMinusOne.getUTCFullYear(), monthMinusOne.getMonth()+1, 0)
    this.rangeMonth.controls["endMonth"].setValue(endMonthMinusOne);
    this.updateWeekChart(monthMinusOne, endMonthMinusOne);
  }
}