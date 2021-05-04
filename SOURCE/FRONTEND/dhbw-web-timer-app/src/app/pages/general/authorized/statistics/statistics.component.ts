import { Component, OnInit } from '@angular/core';
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
  public site: any;
  public sitesTotal: Site[] = [];
  public siteTotal: any;

  public generalInformationTotal: any;
  public generalInformationTag: any;

  public displayedColumns: string[] = ['favicon', 'url', 'visits', 'percentage', 'time'];

  public allData: any = {};
  rangeDay = new FormGroup({
    startDay: new FormControl()
  });

  public imageToShow: any;
  public isImageLoading: boolean = false;

  constructor(private formBuilder: FormBuilder, private statisticsService: StatisticsService) {
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
    this.statisticsService.getDougnutChart(0, new Date().getTime(), (chart: any, sites: any, allData: any)=>{
      this.totalChart = chart;
      this.sitesTotal = sites;
      this.allData = allData;
      this.siteTotal = sites[0];
      this.createGeneralInformationTotal();
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
    this.updateWeekChart(start, end);
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
      this.site = sites[0];
      this.createGeneralInformationTag();
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

  public createGeneralInformationTag(){

    this.generalInformationTag = {};

    let totalTime = 0;
    let totalVisits = 0;

    for(let i=0; i<this.sites.length; i++){
      totalTime += this.sites[i].time;
      totalVisits += this.sites[i].visits;
    }

    this.generalInformationTag.url = "Gesamtdaten:";
    this.generalInformationTag.favicon = "/assets/images/logo.png"
    this.generalInformationTag.prettyTime = this.getPrettyTime(totalTime);
    this.generalInformationTag.percentage = "100%";
    this.generalInformationTag.visits = totalVisits;
  }

  public createGeneralInformationTotal(){
    this.generalInformationTotal = {};

    let totalTime = 0;
    let totalVisits = 0;

    for(let i=0; i<this.sitesTotal.length; i++){
      totalTime += this.sitesTotal[i].time;
      totalVisits += this.sitesTotal[i].visits;
    }

    this.generalInformationTotal.url = "Gesamtdaten:";
    this.generalInformationTotal.favicon = "/assets/images/logo.png"
    this.generalInformationTotal.prettyTime = this.getPrettyTime(totalTime);
    this.generalInformationTotal.percentage = "100%";
    this.generalInformationTotal.visits = totalVisits;
  }

  getPrettyTime(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }
}
