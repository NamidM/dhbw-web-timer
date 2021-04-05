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

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  constructor(private apiService: ApiService) {
  }

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public experienceChart: any;
  public barChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
  ];

  async ngOnInit(){
    this.apiService.getData().subscribe(data=>{
      console.log(data);
    });

    let data = await this.apiService.getTest();
    console.log(data);

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

  startDateSelectionWeek(){
    console.log(new Date(this.range.controls["start"].value));
    let start = new Date(this.range.controls["start"].value);
    start.setDate(start.getDate() - start.getDay());
    this.range.controls["start"].setValue(start);
    console.log("Danach", this.range.controls["start"].value);
  }
  endDateSelectionWeek(){
    let start = new Date(this.range.controls["start"].value);
    let end = new Date(start);
    end.setDate(start.getDate() + 6); 
    this.range.controls["end"].setValue(end);
  }
  startDateSelectionMonth(){
    console.log(new Date(this.range.controls["start"].value));
    let start = new Date(this.range.controls["start"].value);
    start.setDate(1);
    this.range.controls["start"].setValue(start);
    console.log("Danach", this.range.controls["start"].value);
  }
  endDateSelectionMonth(){
    let start = new Date(this.range.controls["start"].value);
    let end = new Date(start.getUTCFullYear(), start.getMonth()+1, 0)
    this.range.controls["end"].setValue(end);
  }
}