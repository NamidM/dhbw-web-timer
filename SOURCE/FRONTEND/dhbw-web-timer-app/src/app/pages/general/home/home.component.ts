import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import {ApiService} from "../../../services/api/api.service";

const getOrCreateTooltip = (chart: any) => {
  let tooltipEl = chart.canvas.parentNode.querySelector('div');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
    tooltipEl.style.borderRadius = '3px';
    tooltipEl.style.color = 'white';
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, 0)';
    tooltipEl.style.transition = 'all .1s ease';

    const table = document.createElement('table');
    table.style.margin = '0px';

    tooltipEl.appendChild(table);
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const externalTooltipHandler = (context: any) => {

  console.log("Context inc:")
  console.log(context);

  // Tooltip Element
  const {chart, tooltip} = context;
  const tooltipEl = getOrCreateTooltip(chart);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set Text
  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const bodyLines = tooltip.body.map((b: any) => b.lines);

    const tableHead = document.createElement('thead');

    titleLines.forEach((title: any) => {
      const tr = document.createElement('tr');
      tr.style.borderWidth = '0';

      const th = document.createElement('th');
      th.style.borderWidth = '0';
      const text = document.createTextNode(title);

      th.appendChild(text);
      tr.appendChild(th);
      tableHead.appendChild(tr);
    });

    const tableBody = document.createElement('tbody');
    bodyLines.forEach((body: any, i: any) => {
      const colors = tooltip.labelColors[i];

      const span = document.createElement('span');
      span.style.background = colors.backgroundColor;
      span.style.borderColor = colors.borderColor;
      span.style.borderWidth = '2px';
      span.style.marginRight = '10px';
      span.style.height = '10px';
      span.style.width = '10px';
      span.style.display = 'inline-block';

      const tr = document.createElement('tr');
      tr.style.backgroundColor = 'inherit';
      tr.style.borderWidth = '0';

      const td = document.createElement('td');
      td.style.borderWidth = '0';

      const text = document.createTextNode(body);

      td.appendChild(span);
      td.appendChild(text);
      tr.appendChild(td);
      tableBody.appendChild(tr);
    });

    const tableRoot = tooltipEl.querySelector('table');

    // Remove old children
    while (tableRoot.firstChild) {
      tableRoot.firstChild.remove();
    }

    // Add new children
    tableRoot.appendChild(tableHead);
    tableRoot.appendChild(tableBody);
  }

  const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.font = tooltip.options.bodyFont.string;
  tooltipEl.style.padding = tooltip.padding + 'px ' + tooltip.padding + 'px';
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  constructor(private snackService: SnackBarService, private apiService: ApiService) { }

  public experienceChart: any;
  public siteNames: string[] = [];
  public times: number[] = [];

  async ngOnInit(){
    this.grabWebActivityData();
  }

  grabWebActivityData(){
    let date = new Date();
    let currentTime = Date.now();
    let millisecondsInDay = date.getHours()*60*60*1000 + date.getMinutes()*60*1000;

    let startOfDay = currentTime - millisecondsInDay;

    this.apiService.getWebActivitiesInTimespan('0', startOfDay.toString(), currentTime.toString()).subscribe((timespanData : any) => {
      let sites: any[] = []

      for(let entry of timespanData){
        let baseUrl:string = entry.url.split('/')[2];
        let timespan:number = entry.endtime - entry.starttime;

        let index = this.findIndexOfSiteWithURL(sites, baseUrl);

        if(index == -1){
          sites.push({url: baseUrl, time: timespan});
        }
        else{
          sites[index].time += timespan;
        }

      }

      sites.sort((a: any, b: any)=>{
        return b.time-a.time;
      });

      console.log(sites.length);

      if(sites.length > 10) {
        let others = {url: "Andere", time: 0, };

        for(let j = 9; j < sites.length; j++) {
          others.time += sites[j].time;
        }

        console.log(others);

        sites.splice(9, 0, others);
        sites.splice(10, sites.length-1);
      }


      for(let i=0; i<sites.length; i++){
        //console.log(sites[i]);

        this.siteNames.push(sites[i].url);
        this.times.push(sites[i].time);
      }

      //console.log(this.siteNames);
      //console.log(this.times);

      this.createDoughnut();
    });

  }



  test(){
    this.snackService.openSnackBar("test", "Ok");
  }

  createDoughnut(){
    // @ts-ignore
    this.experienceChart = {
      options: {scaleShowVerticalLines: false,
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Chart.js Line Chart - External Tooltips'
          },
          tooltip: {
            enabled: false,
            position: 'nearest',
            external: externalTooltipHandler
          }
        }
      },
      type: 'doughnut',
      legend: true,
      data: [
        {data: this.times, label: 'Time spent'},
      ],
    }
  }


  findIndexOfSiteWithURL(sites: any[], url: any){
    for(let i=0; i<sites.length; i++){
      let site = sites[i];
      if(site.url.localeCompare(url) == 0){
        return i;
      }
    }
    return -1;
  }

}



