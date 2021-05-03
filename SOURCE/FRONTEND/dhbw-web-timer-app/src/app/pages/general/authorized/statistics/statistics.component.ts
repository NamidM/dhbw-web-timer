import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Site } from 'src/app/interfaces';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';

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
  public addedWeeks: FormGroup[] = [];
  public addedMonths: FormGroup[] = [];
  private startOfWeek?: Date;
  private endOfWeek?: Date;

  public weekTime: any = [];
  public monthTime: any = [];
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

  constructor(private formBuilder: FormBuilder, private statisticsService: StatisticsService) {
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

    this.updateDayChart(new Date());
    this.updateWeekChart(this.startOfWeek, this.endOfWeek);
    this.updateMonthChart(startOfMonth, endOfMonth);
    this.statisticsService.getDougnutChart(0, new Date().getTime(), (chart: any, sites: any, allData: any)=>{
      this.totalChart = chart;
      this.sitesTotal = sites;
      this.allData = allData;
    });
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
    this.statisticsService.getBarChart(startOfWeek?.getTime(), endOfWeek?.getTime(), this.weekTime, weekForm, (chart: any, weekTime: any)=>{
      this.weekChart = chart;
      this.weekTime = weekTime;
    })
  }

  updateMonthChart(startOfMonth?: Date, endOfMonth?: Date, monthForm?: any) {
    this.statisticsService.getLineChart(startOfMonth, endOfMonth, this.monthTime, monthForm, (chart: any, monthTime: any)=>{
      this.monthChart = chart;
      this.monthTime = monthTime;
    })
  }

  updateDayChart(day: Date){
    let millisecondsInDay = day.getHours()*60*60*1000 + day.getMinutes()*60*1000 + day.getSeconds()*1000;
    let startOfDay = day.getTime() - millisecondsInDay;
    let endOfDay = startOfDay + 24*60*60*1000;
    this.statisticsService.getDougnutChart(startOfDay, endOfDay, (chart: any, sites: any) =>{
      this.dayChart = chart;
      this.sites = sites;
    })
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