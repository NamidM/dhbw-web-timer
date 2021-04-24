import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  public dayChart: any;
  public weekChart: any;
  public monthChart: any;
  public siteNames: string[] = [];
  public addedWeeks: FormGroup[] = [];
  public addedMonths: FormGroup[] = [];
  public comparingWeeks: boolean = false;
  private weekTime:any[] = [];
  private monthTime:any[] = [];
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

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
  }

  async ngOnInit(){
    let currentDate = new Date();
    let startOfWeek = new Date();
    let endOfWeek = new Date();
    let startOfMonth = new Date();
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    startOfWeek.setHours(0);
    startOfWeek.setMinutes(0);
    endOfWeek.setDate(startOfWeek.getDate() + 7); 
    endOfWeek.setHours(0);
    endOfWeek.setMinutes(0);
    startOfMonth.setDate(1);
    let endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 0)
    this.rangeDay.controls["startDay"].setValue(new Date());
    this.rangeWeek.controls["startWeek"].setValue(startOfWeek);
    this.rangeWeek.controls["endWeek"].setValue(endOfWeek);
    this.rangeMonth.controls["startMonth"].setValue(startOfMonth);
    this.rangeMonth.controls["endMonth"].setValue(endOfMonth);

    if(!this.authService.loggedIn) {
      this.router.navigateByUrl("/");
    } else {
      this.updateWeekChart(startOfWeek, endOfWeek);
      this.updateDayChart(currentDate);
      this.updateMonthChart(startOfMonth, endOfMonth);
    }
  }

  dateSelectionDay(){
    this.updateDayChart(new Date(this.rangeDay.controls["startDay"].value));
  }

  startDateSelectionWeek(i?: any){
    console.log(i);
    if(i != undefined) {
      let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
      start.setDate(start.getDate() - start.getDay() + 1);
      start.setHours(0);
      start.setMinutes(0);
      this.addedWeeks[i].controls["startWeek"].setValue(start);
    } else {
      let start = new Date(this.rangeWeek.controls["startWeek"].value);
      start.setDate(start.getDate() - start.getDay() + 1);
      start.setHours(0);
      start.setMinutes(0);
      this.rangeWeek.controls["startWeek"].setValue(start);
    }
  }

  endDateSelectionWeek(i?: any){
    if(i != undefined) {
      let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
      let end = new Date(start);
      end.setHours(0);
      end.setMinutes(0);
      end.setDate(start.getDate() + 7); 
      this.addedWeeks[i].controls["endWeek"].setValue(end);
      this.updateWeekChart(start, end);
    } else {
      let start = new Date(this.rangeWeek.controls["startWeek"].value);
      let end = new Date(start);
      end.setHours(0);
      end.setMinutes(0);
      end.setDate(start.getDate() + 7); 
      this.rangeWeek.controls["endWeek"].setValue(end);
      this.updateWeekChart(start, end);
      console.log(start, end)
    }
  }

  startDateSelectionMonth(i?: any){
    if(i != undefined) {
      let start = new Date(this.addedMonths[i].controls["startMonth"].value);
      start.setDate(1);
      this.addedMonths[i].controls["startMonth"].setValue(start);
    } else {
      let start = new Date(this.rangeMonth.controls["startMonth"].value);
      start.setDate(1);
      this.rangeMonth.controls["startMonth"].setValue(start);
    }
  }

  endDateSelectionMonth(i?: any){
    if(i != undefined) {
      let start = new Date(this.addedMonths[i].controls["startMonth"].value);
      let end = new Date(start.getFullYear(), start.getMonth()+1, 0);
      console.log(start, end)
      this.addedMonths[i].controls["endMonth"].setValue(end);
      this.updateMonthChart(start, end);
    } else {
      let start = new Date(this.rangeMonth.controls["startMonth"].value);
      let end = new Date(start.getFullYear(), start.getMonth()+1, 0);
      this.rangeMonth.controls["endMonth"].setValue(end);
      this.updateMonthChart(start, end);
    }
  }

  updateWeekChart(startOfWeek?: Date, endOfWeek?: Date, weekForm?: any) {
    if(startOfWeek == undefined || endOfWeek == undefined) {
      this.weekTime = this.weekTime.filter(e => e.stack != weekForm.toString());
      this.createWeekChart();
    } else {
      let stack = weekForm != undefined ? weekForm : -1;
      this.weekTime = this.weekTime.filter(e => e.stack != stack.toString());
      this.apiService.getWebActivitiesInTimespan('0', startOfWeek.getTime().toString(), endOfWeek.getTime().toString()).subscribe((timespanData : any) => {
        let week: any[] = [];
        let urls = [];
        let startTime = new Date();
        let counter = this.weekTime.length;
        for(let e of timespanData) {
          let baseUrl = e.url.split('/')[2];
          startTime.setTime(e.starttime);
          let weekIndex = startTime.getDay() - 1;
          if(weekIndex == -1) weekIndex = 6;
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
          // Only check for days with input
          if(week[i]) {
            // Sort entries for time
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
              let weekIndex = startTime.getDay() - 1;
              if(weekIndex == -1) weekIndex = 6;
              if(!urls[baseUrl]){
                let r = Math.floor(Math.random() * 255);
                let g = Math.floor(Math.random() * 255);
                let b = Math.floor(Math.random() * 255);
                urls[baseUrl] = { num: counter, color: `rgba(${r}, ${g}, ${b}, 0.6)`};
                counter++;
              }
              if(!this.weekTime[urls[baseUrl].num]){
                this.weekTime[urls[baseUrl].num] = {
                  data: [0,0,0,0,0,0,0], 
                  label: baseUrl, 
                  stack: stack.toString(),
                  // backgroundColor: urls[baseUrl].color, 
                  // hoverBackgroundColor: urls[baseUrl].color
                };
              }
              this.weekTime[urls[baseUrl].num].data[weekIndex] += Math.floor(week[i][j].time/1000/6)/10;
            }
          }
        }       
        this.createWeekChart();
      });
    }
  }

  updateMonthChart(startOfMonth?: Date, endOfMonth?: Date, monthForm?: any) {
    if(startOfMonth == undefined || endOfMonth == undefined) {
      this.monthTime = this.monthTime.filter(e => e.stack != monthForm);
      this.createMonthChart();
    } else {
      let stack = monthForm != undefined ? monthForm : -1;
      this.monthTime = this.monthTime.filter(e => e.stack != stack);
      this.apiService.getWebActivitiesInTimespan('0', startOfMonth.getTime().toString(), endOfMonth.getTime().toString()).subscribe((timespanData : any) => {
        let monthData: any = [];
        for(let i = 0; i < endOfMonth.getDate(); i++){
          monthData[i] = 0;
        }
        let startTime = new Date();
        for(let e of timespanData) {
          startTime.setTime(e.starttime);
          let dayIndex = startTime.getDate()-1;
          monthData[dayIndex] += e.endtime - e.starttime;
        }
        for(let i = 0; i < endOfMonth.getDate(); i++){
          monthData[i] = Math.floor(monthData[i] / 1000 / 6 / 6)/100;
        }
        let stack = monthForm != undefined ? monthForm : -1;
        this.monthTime.push({
          data: monthData, 
          label: "Stunden",
          stack: stack
        });
        this.createMonthChart();
      });
    }
  }

  updateDayChart(day: Date){
    let times: number[] = [];
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
        times.push(time);
      }
      this.createDayDoughnut(times);
    });
  }
  createMonthChart(){
    let labels = [];
    for(let i = 0; i < 31; i++){
      labels[i] = i+1;
    }
    this.monthChart = {
      options: {scaleShowVerticalLines: false,
        elements: {
          line: {
              tension: 0
          }
      },
        responsive: true,
        scales: {yAxes: [{ticks: {beginAtZero: true}, scaleLabel: {
          display: true,
          labelString: 'Stunden'
        }}]}},
      labels: labels,
      type: 'line',
      legend: false,
      data: this.monthTime
    }
  }
  createWeekChart(){
    console.log(this.weekChart);
    this.weekChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
          },
          yAxes: [
            {
              ticks: {beginAtZero: true},
              scaleLabel: {
                display: true,
                labelString: 'Minuten'
              }
            }
          ]
        }
      },
      labels: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
      type: 'bar',
      legend: false,
      data: this.weekTime
    }
  }
  createDayDoughnut(times: any){
    this.dayChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        scales: {yAxes: [{ticks: {beginAtZero: true}}]}},
      labels: this.siteNames,
      type: 'doughnut',
      legend: true,
      data: [
        {data: times, label: 'times'},
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

  nextWeek(i?: any) {
    if(i != undefined) {
      let weekPlusOne = new Date(this.addedWeeks[i].controls["startWeek"].value);
      weekPlusOne.setTime(weekPlusOne.getTime()+24*60*60*1000*7);
      this.addedWeeks[i].controls["startWeek"].setValue(weekPlusOne);
      let endWeekPlusOne = new Date(weekPlusOne);
      endWeekPlusOne.setDate(weekPlusOne.getDate() + 7); 
      endWeekPlusOne.setHours(0);
      endWeekPlusOne.setMinutes(0);
      this.addedWeeks[i].controls["endWeek"].setValue(endWeekPlusOne);
      this.updateWeekChart(weekPlusOne, endWeekPlusOne, i);
    } else {
      let weekPlusOne = new Date(this.rangeWeek.controls["startWeek"].value);
      weekPlusOne.setTime(weekPlusOne.getTime()+24*60*60*1000*7);
      this.rangeWeek.controls["startWeek"].setValue(weekPlusOne);
      let endWeekPlusOne = new Date(weekPlusOne);
      endWeekPlusOne.setDate(weekPlusOne.getDate() + 7); 
      endWeekPlusOne.setHours(0);
      endWeekPlusOne.setMinutes(0);
      this.rangeWeek.controls["endWeek"].setValue(endWeekPlusOne);
      this.updateWeekChart(weekPlusOne, endWeekPlusOne);
    }
  }

  prevWeek(i?: any) {
    if(i != undefined) {
      let weekMinusOne = new Date(this.addedWeeks[i].controls["startWeek"].value);
      weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
      this.addedWeeks[i].controls["startWeek"].setValue(weekMinusOne);
      let endWeekMinusOne = new Date(weekMinusOne)
      endWeekMinusOne.setDate(weekMinusOne.getDate() + 7); 
      endWeekMinusOne.setHours(0);
      endWeekMinusOne.setMinutes(0);
      this.addedWeeks[i].controls["endWeek"].setValue(endWeekMinusOne);
      this.updateWeekChart(weekMinusOne, endWeekMinusOne, i);
    } else {
      let weekMinusOne = new Date(this.rangeWeek.controls["startWeek"].value);
      weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
      this.rangeWeek.controls["startWeek"].setValue(weekMinusOne);
      let endWeekMinusOne = new Date(weekMinusOne)
      endWeekMinusOne.setDate(weekMinusOne.getDate() + 7); 
      endWeekMinusOne.setHours(0);
      endWeekMinusOne.setMinutes(0);
      this.rangeWeek.controls["endWeek"].setValue(endWeekMinusOne);
      this.updateWeekChart(weekMinusOne, endWeekMinusOne);
    }
  }

  nextMonth(i?: any) {
    if(i != undefined) {
      let monthPlusOne = new Date(this.addedMonths[i].controls["startMonth"].value);
      monthPlusOne.setMonth(monthPlusOne.getMonth()+1);
      this.addedMonths[i].controls["startMonth"].setValue(monthPlusOne);
      let endMonthPlusOne = new Date(monthPlusOne.getFullYear(), monthPlusOne.getMonth()+1, 0)
      this.addedMonths[i].controls["endMonth"].setValue(endMonthPlusOne);
      this.updateMonthChart(monthPlusOne, endMonthPlusOne, i);
    } else {
      let monthPlusOne = new Date(this.rangeMonth.controls["startMonth"].value);
      monthPlusOne.setMonth(monthPlusOne.getMonth()+1);
      this.rangeMonth.controls["startMonth"].setValue(monthPlusOne);
      let endMonthPlusOne = new Date(monthPlusOne.getFullYear(), monthPlusOne.getMonth()+1, 0)
      this.rangeMonth.controls["endMonth"].setValue(endMonthPlusOne);
      this.updateMonthChart(monthPlusOne, endMonthPlusOne);
    }
  }

  prevMonth(i?: any) {
    if(i != undefined) {
      let monthMinusOne = new Date(this.addedMonths[i].controls["startMonth"].value);
      monthMinusOne.setMonth(monthMinusOne.getMonth()-1);
      this.addedMonths[i].controls["startMonth"].setValue(monthMinusOne);
      let endMonthMinusOne = new Date(monthMinusOne.getUTCFullYear(), monthMinusOne.getMonth()+1, 0)
      this.addedMonths[i].controls["endMonth"].setValue(endMonthMinusOne);
      this.updateMonthChart(monthMinusOne, endMonthMinusOne, i);
    } else {
      let monthMinusOne = new Date(this.rangeMonth.controls["startMonth"].value);
      monthMinusOne.setMonth(monthMinusOne.getMonth()-1);
      this.rangeMonth.controls["startMonth"].setValue(monthMinusOne);
      let endMonthMinusOne = new Date(monthMinusOne.getUTCFullYear(), monthMinusOne.getMonth()+1, 0)
      this.rangeMonth.controls["endMonth"].setValue(endMonthMinusOne);
      this.updateMonthChart(monthMinusOne, endMonthMinusOne);
    }
  }

  addWeek(){
    if(this.addedWeeks.length <= 4) {
      this.comparingWeeks = true;
      this.addedWeeks.push(this.formBuilder.group({
        startWeek: new FormControl(),
        endWeek: new FormControl()
      }));
      let currentDate = new Date();
      let startOfWeek = new Date();
      let endOfWeek = new Date();
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      endOfWeek.setDate(startOfWeek.getDate() + 6); 
      endOfWeek.setHours(0);
      endOfWeek.setMinutes(0);
      endOfWeek.setDate(endOfWeek.getDate());
      this.addedWeeks[this.addedWeeks.length - 1].controls["startWeek"].setValue(startOfWeek);
      this.addedWeeks[this.addedWeeks.length - 1].controls["endWeek"].setValue(endOfWeek);
      this.updateWeekChart(startOfWeek, endOfWeek, this.addedWeeks.length - 1);
    }
  }

  deleteWeek(i: any) {
    if(this.addedWeeks.length > 0) {
      this.addedWeeks.splice(i, 1);
      this.updateWeekChart(undefined, undefined, i);
      if(this.addedWeeks.length == 0) {
        this.comparingWeeks = false;
      }
    }
  }

  addMonth(){
    if(this.addedMonths.length <= 4) {
      this.addedMonths.push(this.formBuilder.group({
        startMonth: new FormControl(),
        endMonth: new FormControl()
      }));
      let startOfMonth = new Date();
      startOfMonth.setDate(1);
      let endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 0)
      this.addedMonths[this.addedMonths.length - 1].controls["startMonth"].setValue(startOfMonth);
      this.addedMonths[this.addedMonths.length - 1].controls["endMonth"].setValue(endOfMonth);
      this.updateMonthChart(startOfMonth, endOfMonth, this.addedMonths.length - 1);
    }
  }

  deleteMonth(i: any) {
    if(this.addedMonths.length > 0) {
      this.addedMonths.splice(i, 1);
      this.updateMonthChart(undefined, undefined, i);
    }
  }
}