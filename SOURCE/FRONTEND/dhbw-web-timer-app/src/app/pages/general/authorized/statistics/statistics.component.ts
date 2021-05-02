import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Site } from 'src/app/interfaces';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  public dayChart: any;
  public totalChart: any;
  public weekChart: any;
  public monthChart: any;
  public siteNames: string[] = [];
  public siteNamesTotal: string[] = [];
  public addedWeeks: FormGroup[] = [];
  public addedMonths: FormGroup[] = [];
  private weekTime:any[] = [];
  private monthTime:any[] = [];
  private startOfWeek?: Date;
  private endOfWeek?: Date;

  public times: number[] = [];
  public timesTotal: number[] = [];
  public sites: Site[] = [];
  public sitesTotal: Site[] = [];

  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];

  public allData: any = {};
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

  // @ts-ignore
  @ViewChild('titleTotal') detailsCardTitleTotal: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('detailsCardAbsoluteTimeTotal') detailsCardAbsoluteTimeTotal: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('detailsCardPercentTotal') detailsCardPercentTotal: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('faviconTotal') faviconTotal: ElementRef<HTMLElement>;
  // @ts-ignore
  @ViewChild('visitsTotal') visitsTotal: ElementRef<HTMLElement>;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder) {
  }

  async ngOnInit(){
    let currentDate = new Date();
    let day = currentDate.getDay() == 0 ? 7 : currentDate.getDay();
    this.startOfWeek = new Date();
    this.startOfWeek.setDate(currentDate.getDate() - day + 1);
    this.startOfWeek.setHours(0);
    this.startOfWeek.setMinutes(0);
    this.startOfWeek.setSeconds(0);
    this.endOfWeek = this.getEndWeek(this.startOfWeek);
    let startOfMonth = new Date();
    startOfMonth.setDate(1);
    let endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 0)
    this.rangeDay.controls["startDay"].setValue(new Date());
    this.rangeWeek.controls["startWeek"].setValue(this.startOfWeek);
    this.rangeWeek.controls["endWeek"].setValue(this.endOfWeek);
    this.rangeMonth.controls["startMonth"].setValue(startOfMonth);
    this.rangeMonth.controls["endMonth"].setValue(endOfMonth);

    this.updateWeekChart(this.startOfWeek, this.endOfWeek);
    this.updateDayChart(currentDate);
    this.updateMonthChart(startOfMonth, endOfMonth);
    this.updateTotalChart();
  }

  dateSelectionDay(){
    this.updateDayChart(new Date(this.rangeDay.controls["startDay"].value));
  }

  startDateSelectionWeek(i?: any){
    if(i != undefined) {
      let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
      let day = start.getDay() == 0 ? 7 : start.getDay();
      start.setDate(start.getDate() - day + 1);
      this.addedWeeks[i].controls["startWeek"].setValue(start);
    } else {
      let start = new Date(this.rangeWeek.controls["startWeek"].value);
      let day = start.getDay() == 0 ? 7 : start.getDay();
      start.setDate(start.getDate() - day + 1);
      this.rangeWeek.controls["startWeek"].setValue(start);
    }
  }

  endDateSelectionWeek(i?: any){
    if(i != undefined) {
      let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
      let end = this.getEndWeek(start);
      this.addedWeeks[i].controls["endWeek"].setValue(end);
      this.updateWeekChart(start, end);
    } else {
      let start = new Date(this.rangeWeek.controls["startWeek"].value);
      let end = this.getEndWeek(start);
      this.rangeWeek.controls["endWeek"].setValue(end);
      this.updateWeekChart(start, end);
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
      this.apiService.getWebActivitiesInTimespan(startOfWeek.getTime().toString(), endOfWeek.getTime().toString()).subscribe((timespanData : any) => {
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
      this.apiService.getWebActivitiesInTimespan(startOfMonth.getTime().toString(), endOfMonth.getTime().toString()).subscribe((timespanData : any) => {
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
          monthData[i] = Math.floor(((monthData[i] / 10) / 60) / 60)/100;
        }
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];
        let stack = monthForm != undefined ? monthForm : -1;
        let indexFromStack = this.monthTime.findIndex(e => e.stack == stack);
        if(this.monthTime[indexFromStack]) {
          this.monthTime[indexFromStack] = {
            data: monthData, 
            label: monthNames[startOfMonth.getMonth()],
            stack: stack
          };
        } else {
          this.monthTime.push({
            data: monthData, 
            label: monthNames[startOfMonth.getMonth()],
            stack: stack
          });
        }
        this.createMonthChart();
      });
    }
  }

  updateDayChart(day: Date){
    let millisecondsInDay = day.getHours()*60*60*1000 + day.getMinutes()*60*1000 + day.getSeconds()*1000;
    let startOfDay = day.getTime() - millisecondsInDay;
    let endOfDay = startOfDay + 24*60*60*1000;
    this.siteNames = [];
    this.times = [];
    this.apiService.getWebActivitiesInTimespan(startOfDay.toString(), endOfDay.toString()).subscribe((timespanData : any) => {
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
        let others = {url: "Andere", time: 0, visits: 0 };
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
      if(sites.length > 0) {
        this.createDayDoughnut();
      } else {
        this.dayChart = null;
      }
    });
  }
  updateTotalChart(){
    this.siteNamesTotal = [];
    this.timesTotal = [];
    this.apiService.getWebActivitiesInTimespan("0", new Date().getTime().toString()).subscribe((timespanData : any) => {
      let sites: any[] = []
      let first = Infinity;
      
      for(let entry of timespanData){
        let baseUrl:string = entry.url.split('/')[2];
        let timespan:number = entry.endtime - entry.starttime;
        let index = this.findIndexOfSiteWithURL(sites, baseUrl);
        first = Math.min(first, entry.starttime);
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
        let others = {url: "Andere", time: 0, visits: 0 };
        for(let j = 9; j < sites.length; j++) {
          others.time += sites[j].time;
          others.visits++;
        }
        sites.splice(9, 0, others);
        sites.splice(10, sites.length-1);
      }

      sites = this.setPercentage(sites);
      sites = this.setPrettyTime(sites);
      let sum = 0;
      for(let i=0; i<sites.length; i++){
        this.siteNamesTotal.push(sites[i].url);
        sum += sites[i].time;
        this.timesTotal.push(sites[i].time);
      }
      this.sitesTotal = sites;
      if(sites.length > 0) {
        this.createDayDoughnut();
      } else {
        this.dayChart = null;
      }

      this.allData.bestSite = this.siteNamesTotal[this.timesTotal.indexOf(Math.max(...this.timesTotal))];
      this.allData.firstTime = this.getPrettyDate(first);
      this.allData.allTime = this.getPrettyTime(sum);
      this.allData.avgTime = this.getPrettyTime(sum/this.timesTotal.length);
      this.createTotalDoughnut();
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
          line: {tension: 0}
      },
        responsive: true,
        scales: {yAxes: [{ticks: {beginAtZero: true}, scaleLabel: {
          display: true,
          labelString: 'Stunden'
        }}]}
      },
      labels: labels,
      type: 'line',
      legend: true,
      data: this.monthTime
    }
  }
  createWeekChart(){
    this.weekChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        scales: {
          x: {stacked: true},
          y: {stacked: true},
          
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

  createTotalDoughnut() {
    this.totalChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
      },
      labels: this.siteNamesTotal,
      type: 'doughnut',
      legend: true,
      data: [
        {data: this.timesTotal, label: 'times'},
      ],
    }
  }

  createDayDoughnut(){
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
      let endWeekPlusOne = this.getEndWeek(weekPlusOne);
      this.addedWeeks[i].controls["endWeek"].setValue(endWeekPlusOne);
      this.updateWeekChart(weekPlusOne, endWeekPlusOne, i);
    } else {
      let weekPlusOne = new Date(this.rangeWeek.controls["startWeek"].value);
      weekPlusOne.setTime(weekPlusOne.getTime()+24*60*60*1000*7);
      this.rangeWeek.controls["startWeek"].setValue(weekPlusOne);
      let endWeekPlusOne = this.getEndWeek(weekPlusOne);
      this.rangeWeek.controls["endWeek"].setValue(endWeekPlusOne);
      this.updateWeekChart(weekPlusOne, endWeekPlusOne);
    }
  }

  prevWeek(i?: any) {
    if(i != undefined) {
      let weekMinusOne = new Date(this.addedWeeks[i].controls["startWeek"].value);
      weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
      this.addedWeeks[i].controls["startWeek"].setValue(weekMinusOne);
      let endWeekMinusOne = this.getEndWeek(weekMinusOne);
      this.addedWeeks[i].controls["endWeek"].setValue(endWeekMinusOne);
      this.updateWeekChart(weekMinusOne, endWeekMinusOne, i);
    } else {
      let weekMinusOne = new Date(this.rangeWeek.controls["startWeek"].value);
      weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
      this.rangeWeek.controls["startWeek"].setValue(weekMinusOne);
      let endWeekMinusOne = this.getEndWeek(weekMinusOne);
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
      this.addedWeeks.push(this.formBuilder.group({
        startWeek: new FormControl(),
        endWeek: new FormControl(),
        index: new FormControl()
      }));
      this.addedWeeks[this.addedWeeks.length - 1].controls["startWeek"].setValue(this.startOfWeek);
      this.addedWeeks[this.addedWeeks.length - 1].controls["endWeek"].setValue(this.endOfWeek);
      this.addedWeeks[this.addedWeeks.length - 1].controls["index"].setValue(this.addedWeeks.length - 1);
      this.updateWeekChart(this.startOfWeek, this.endOfWeek, this.addedWeeks.length - 1);
    }
  }

  deleteWeek(i: any) {
    if(this.addedWeeks.length > 0) {
      this.addedWeeks = this.addedWeeks.filter(e => e.controls.index.value != i);
      this.updateWeekChart(undefined, undefined, i);
    }
  }

  addMonth(){
    if(this.addedMonths.length <= 4) {
      this.addedMonths.push(this.formBuilder.group({
        startMonth: new FormControl(),
        endMonth: new FormControl(),
        index: new FormControl()
      }));
      let startOfMonth = new Date();
      startOfMonth.setDate(1);
      let endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 0)
      this.addedMonths[this.addedMonths.length - 1].controls["startMonth"].setValue(startOfMonth);
      this.addedMonths[this.addedMonths.length - 1].controls["endMonth"].setValue(endOfMonth);
      this.addedMonths[this.addedMonths.length - 1].controls["index"].setValue(this.addedMonths.length - 1);
      this.updateMonthChart(startOfMonth, endOfMonth, this.addedMonths.length - 1);
    }
  }

  deleteMonth(i: any) {
    if(this.addedMonths.length > 0) {
      this.addedMonths = this.addedMonths.filter(e => e.controls.index.value != i);
      this.updateMonthChart(undefined, undefined, i);
    }
  }

  getEndWeek(start: Date) {
    let end = new Date(start);
    end.setDate(start.getDate() + 7); 
    end.setHours(0);
    end.setMinutes(0);
    end.setSeconds(-1);
    return end;
  }

  getPrettyTime(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }

  getPrettyDate(milliseconds: number) {
    let date = new Date(milliseconds);
    let d = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let m = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    return d + "." + m + "." + date.getFullYear();
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
      sites[i].prettyTime = this.getPrettyTime(sites[i].time);
    }
    return sites;
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }, total?: boolean): void {
    const hovered : any = active[0];
    if(total) {
      let site = this.sitesTotal[hovered._index];
      this.detailsCardTitleTotal.nativeElement.innerHTML = site.url;
      this.detailsCardAbsoluteTimeTotal.nativeElement.innerHTML = site.prettyTime;
      this.detailsCardPercentTotal.nativeElement.innerHTML = site.percentage.toString() + "%";
      this.faviconTotal.nativeElement.setAttribute("src", site.favicon);
      this.visitsTotal.nativeElement.innerHTML = "Visits: " + site.visits.toString();
    } else {
      let site = this.sites[hovered._index];
      this.detailsCardTitle.nativeElement.innerHTML = site.url;
      this.detailsCardAbsoluteTime.nativeElement.innerHTML = site.prettyTime;
      this.detailsCardPercent.nativeElement.innerHTML = site.percentage.toString() + "%";
      this.favicon.nativeElement.setAttribute("src", site.favicon);
      this.visits.nativeElement.innerHTML = "Visits: " + site.visits.toString();
    }
  }
}