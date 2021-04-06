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
      let weekTime = [];
      let week: any[] = [];
      let urls = [];
      let startTime = new Date();
      let counter = 0;
      for(let e of timespanData) {
        let baseUrl = e.url.split('/')[2];
        startTime.setTime(e.starttime);
        let weekIndex = startTime.getDay();

        if(!week[weekIndex]) {
          week[weekIndex] = [];
        }
        let urlIndex = week[weekIndex].findIndex((e: any) => e.url == baseUrl);
        if(urlIndex == -1){
          week[weekIndex].push({time: (e.endtime - e.starttime), url: baseUrl, startTime: e.starttime})
        } else {
          week[weekIndex][urlIndex].time += (e.endtime - e.starttime);
        }
      }
      for(let i = 0; i<7; i++){
        if(week[i]) {
          week[i].sort((a: any, b: any)=>{
            return b.time-a.time;
          });
          if(week[i].length > 10) {
            let others = {time: 0, url: "Andere", startTime: 0};

            for(let j = 9; j < week[i].length; j++) {
              others.startTime = week[i][j].startTime;
              others.time += week[i][j].time;
            }
            week[i].splice(9, 0, others);
            week[i].splice(10, week[i].length-1);
          }

          for(let j = 0; j < week[i].length; j++) {
            let baseUrl = week[i][j].url;
            startTime.setTime(week[i][j].startTime);
            let weekIndex = startTime.getDay();
            if(!urls[baseUrl]){
              let r = Math.floor(Math.random() * 255);
              let g = Math.floor(Math.random() * 255);
              let b = Math.floor(Math.random() * 255);
              urls[baseUrl] = { num: counter, color: `rgba(${r}, ${g}, ${b}, 0.6)`};
              counter++;
            }
      
            if(!weekTime[urls[baseUrl].num]){
              weekTime[urls[baseUrl].num] = {
                data: [0,0,0,0,0,0,0], 
                label: baseUrl, 
                stack: 'a', 
                backgroundColor: urls[baseUrl].color, 
                hoverBackgroundColor: urls[baseUrl].color
              };
            }
            weekTime[urls[baseUrl].num].data[weekIndex] += Math.floor(week[i][j].time/1000/6)/10;
          }
          console.log(weekTime)
        }
      }

      // for(let i = 0; i<weekTime.length; i++){
      //   weekTime[i] = Math.floor(((weekTime[i]/1000))/6)/100;
      // }     
      // [
      //   { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A', stack: 'a' },
      //   { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B', stack: 'a' },
      //   { data: [28, 48, 40, 19, 86], label: 'Series B', stack: 'a' }
      // ]
      console.log("22",weekTime)
      // this.weekChart = {
      //   labels:  ['2006', '2007', '2008', '2009', '2010', '2011', '2012'],
      //   type: "bar",
      //   legend: true,
      //   plugins: [],
      //   options: {},
      //   data: [
      //     { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A', stack: 'a' },
      //     { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B', stack: 'a' },
      //     { data: [28, 48, 40, 19, 86], label: 'Series B', stack: 'a' }
      //   ]
      // }
            
      this.weekChart = {
        options: {scaleShowVerticalLines: false,
          responsive: true,
          scales: {
            x: {
              stacked: true
            },
            y: {
              stacked: true
            },
            yAxes: [{ticks: {beginAtZero: true}}]
          }
        },
        labels: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
        type: 'bar',
        legend: false,
        data: weekTime
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