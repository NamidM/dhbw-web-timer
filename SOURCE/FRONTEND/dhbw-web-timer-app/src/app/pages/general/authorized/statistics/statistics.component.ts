import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Site } from 'src/app/interfaces';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';
import { PostDialogComponent } from 'src/app/shared/dialogs/post-dialog/post-dialog.component';

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

  public weekTime: any[] = [];
  public monthTime: any[] = [];
  public monthDataValid: boolean = false;
  public weekTimeIvalid: boolean = false;
  public sites: Site[] = [];
  public site: any;
  public loading: boolean = true;
  public sitesTotal: Site[] = [];
  public siteTotal: any;

  public generalInformationTotal: any;
  public generalInformationTag: any;

  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];

  public allData: any = {};
  rangeDay = new FormGroup({
    startDay: new FormControl()
  });

  constructor(private formBuilder: FormBuilder, private statisticsService: StatisticsService, private dialog: MatDialog) {
  }

  async ngOnInit(){
    let day = new Date().getDay() == 0 ? 7 : new Date().getDay();
    this.startOfWeek = new Date((new Date().getMonth() + 1) + "." + (new Date().getDate() - day + 1) + "." + new Date().getFullYear());
    this.endOfWeek = this.getEndWeek(this.startOfWeek);

    let startOfMonth = new Date();
    startOfMonth.setDate(1);
    let endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth()+1, 0)

    this.addWeek();
    this.addMonth();
    this.rangeDay.controls["startDay"].setValue(new Date());
    this.addedWeeks[0].controls["startWeek"].setValue(this.startOfWeek);
    this.addedWeeks[0].controls["endWeek"].setValue(this.endOfWeek);
    this.addedMonths[0].controls["startMonth"].setValue(startOfMonth);
    this.addedMonths[0].controls["endMonth"].setValue(endOfMonth);

    this.updateDayChart(new Date());
    this.statisticsService.getDonutChart(0, new Date().getTime(), (chart: any, sites: any, allData: any, generalInformation: any)=>{
      this.totalChart = chart;
      this.sitesTotal = sites;
      this.allData = allData? allData : {};
      this.siteTotal = generalInformation;
      this.generalInformationTotal = generalInformation;
    });
  }

  postStatistics(type: string) {
    let sites, startTime;
    switch(type) {
      case 'daily': sites = this.sites; startTime = this.rangeDay.controls.startDay.value; break;
      case 'total': sites = this.sitesTotal; break;
      case 'weekly': sites = this.weekTime; break;
      case 'monthly': sites = this.monthTime; break;
    }
    this.dialog.open(PostDialogComponent, {
      width: '70vw',
      height: '75vh',
      data: {sites, type, startTime}
    });
  }

  dateSelectionDay(){
    this.updateDayChart(new Date(this.rangeDay.controls["startDay"].value));
  }

  startDateSelectionWeek(i: any){
    let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
    let day = start.getDay() == 0 ? 7 : start.getDay();
    start.setDate(start.getDate() - day + 1);
    this.addedWeeks[i].controls["startWeek"].setValue(start);
  }

  endDateSelectionWeek(i: any){
    let start = new Date(this.addedWeeks[i].controls["startWeek"].value);
    let end = this.getEndWeek(start);
    this.addedWeeks[i].controls["endWeek"].setValue(end);
    this.updateWeekChart(start, end, i);
  }

  startDateSelectionMonth(i?: any){
    let start = new Date(this.addedMonths[i].controls["startMonth"].value);
    start.setDate(1);
    this.addedMonths[i].controls["startMonth"].setValue(start);
  }

  endDateSelectionMonth(i?: any){
    let start = new Date(this.addedMonths[i].controls["startMonth"].value);
    let end = new Date(start.getFullYear(), start.getMonth()+1, 0);
    this.addedMonths[i].controls["endMonth"].setValue(end);
    this.updateMonthChart(start, end);
  }

  updateWeekChart(startOfWeek?: Date, endOfWeek?: Date, weekForm?: any) {
    this.statisticsService.getBarChart(startOfWeek?.getTime(), endOfWeek?.getTime(), this.weekTime, weekForm, (chart: any, weekTime: any)=>{
      this.weekChart = chart;
      this.weekTime = weekTime;
      if(this.weekTime.length == 0 || this.weekTime[0].data.length == 0) this.weekTimeIvalid = true;
      else this.weekTimeIvalid = false;
    })
  }

  updateMonthChart(startOfMonth?: Date, endOfMonth?: Date, monthForm?: any) {
    this.statisticsService.getLineChart(startOfMonth, endOfMonth, this.monthTime, monthForm, (chart: any, monthTime: any)=>{
      this.monthChart = chart;
      this.monthTime = monthTime;
      this.monthDataValid = monthTime.some((e:any)=> e.data.length==0);
    })
  }

  updateDayChart(day: Date){
    let millisecondsInDay = day.getHours()*60*60*1000 + day.getMinutes()*60*1000 + day.getSeconds()*1000;
    let startOfDay = day.getTime() - millisecondsInDay;
    let endOfDay = startOfDay + 24*60*60*1000;
    this.statisticsService.getDonutChart(startOfDay, endOfDay, (chart: any, sites: any, allData: any, generalInformation: any) =>{
      this.dayChart = chart;
      this.sites = sites;
      this.site = generalInformation;
      this.generalInformationTag = generalInformation;
      this.loading = false;
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

  nextWeek(i: any) {
    let weekPlusOne = new Date(this.addedWeeks[i].controls["startWeek"].value);
    weekPlusOne.setTime(weekPlusOne.getTime()+24*60*60*1000*7);
    this.addedWeeks[i].controls["startWeek"].setValue(weekPlusOne);
    let endWeekPlusOne = this.getEndWeek(weekPlusOne);
    this.addedWeeks[i].controls["endWeek"].setValue(endWeekPlusOne);
    this.updateWeekChart(weekPlusOne, endWeekPlusOne, i);
  }

  prevWeek(i: any) {
    let weekMinusOne = new Date(this.addedWeeks[i].controls["startWeek"].value);
    weekMinusOne.setTime(weekMinusOne.getTime()-24*60*60*1000*7);
    this.addedWeeks[i].controls["startWeek"].setValue(weekMinusOne);
    let endWeekMinusOne = this.getEndWeek(weekMinusOne);
    this.addedWeeks[i].controls["endWeek"].setValue(endWeekMinusOne);
    this.updateWeekChart(weekMinusOne, endWeekMinusOne, i);
  }

  nextMonth(i?: any) {
    let monthPlusOne = new Date(this.addedMonths[i].controls["startMonth"].value);
    monthPlusOne.setMonth(monthPlusOne.getMonth()+1);
    this.addedMonths[i].controls["startMonth"].setValue(monthPlusOne);
    let endMonthPlusOne = new Date(monthPlusOne.getFullYear(), monthPlusOne.getMonth()+1, 0)
    this.addedMonths[i].controls["endMonth"].setValue(endMonthPlusOne);
    this.updateMonthChart(monthPlusOne, endMonthPlusOne, i);
  }

  prevMonth(i?: any) {
    let monthMinusOne = new Date(this.addedMonths[i].controls["startMonth"].value);
    monthMinusOne.setMonth(monthMinusOne.getMonth()-1);
    this.addedMonths[i].controls["startMonth"].setValue(monthMinusOne);
    let endMonthMinusOne = new Date(monthMinusOne.getUTCFullYear(), monthMinusOne.getMonth()+1, 0)
    this.addedMonths[i].controls["endMonth"].setValue(endMonthMinusOne);
    this.updateMonthChart(monthMinusOne, endMonthMinusOne, i);
  }

  addWeek(){
    if(this.addedWeeks.length <= 5) {
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
    if(this.addedMonths.length <= 5) {
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
    end.setHours(0, 0 , -1);
    return end;
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }, total?: boolean): void {
    const hovered : any = active[0];
    if(total) {
      this.siteTotal = this.sitesTotal[hovered._index];
    } else {
      this.site = this.sites[hovered._index];
    }
  }
}