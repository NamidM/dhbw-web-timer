import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor(private apiService: ApiService) { }
  /* Function to show donut chart */
  showDoughnutChart(sites: any, callback: Function) {
    let siteNames = [];
    let times = [];
    let totalTime: any = 0, totalVisits = 0, generalInformation: any = {};
    for(let i=0; i<sites.length; i++){
      siteNames.push(sites[i].url);
      times.push(sites[i].time);
      totalTime += sites[i].time;
      totalVisits += sites[i].visits;
    }
    generalInformation.url = "Gesamtdaten:";
    generalInformation.favicon = "/assets/images/logo.png"
    generalInformation.prettyTime = this.getPrettyTime(totalTime);
    generalInformation.percentage = "100";
    generalInformation.visits = totalVisits;
    if(sites.length > 0) {
      callback({
        options: {
         tooltips: {
           enabled: false
         },
         responsive: true
        },
       type: 'doughnut',
       legend: true,
       data: [
         {data: times, label: 'Time spent'},
       ],
       labels: siteNames
     }, generalInformation)
    } else {
      callback(null);
    }
  }
  /* Function to show bar chart */
  showBarChart(sites: any, callback: Function) {
    callback({
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
      data: sites
    })
  }
  /* Function to show line chart */
  showLineChart(sites: any, callback: Function) {
    let labels = [];
    for(let i = 0; i < 31; i++){
      labels[i] = i+1;
    }
    callback({
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
      data: sites
    });
  }
  /* Function to get donut chart data */
  getDonutChart(startTime: number, endTime: number, callback: Function) {
    let siteNames: String[] = [];
    let times: number[] = [];
    this.apiService.getWebActivitiesInTimespan(startTime.toString(), endTime.toString()).subscribe( async (timespanData : any) => {
      let sites: any[] = [];
      let first = Infinity;
      for(let i = 0; i<timespanData.length; i++){
        let entry = timespanData[i];
        let baseUrl:string = entry.url.split('/')[2];
        let timespan:number = entry.endtime - entry.starttime;
        let index = this.findIndexOfSiteWithURL(sites, baseUrl);
        first = Math.min(first, entry.starttime);
        await this.testImage(entry.faviconUrl).catch((url: any) => {
          entry.faviconUrl = url;
        });
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
        let others = {url: "Andere", time: 0, visits: 0, favicon: '/assets/images/defaultFavicon.png'};
        for(let j = 9; j < sites.length; j++) {
          others.time += sites[j].time;
          others.visits++;
        }
        sites.splice(9, 0, others);
        sites.splice(10, sites.length-1);
      }
      sites.sort((a: any, b: any)=>{
        return b.time-a.time;
      });
      sites = this.setPercentage(sites);
      sites = this.setPrettyTime(sites);
      let sum = 0;
      let generalInformation: any = {};
      let totalTime = 0;
      let totalVisits = 0;
      for(let i=0; i<sites.length; i++){
        siteNames.push(sites[i].url);
        times.push(sites[i].time);
        sum += sites[i].time;
        totalTime += sites[i].time;
        totalVisits += sites[i].visits;
      }
      generalInformation = {
        url: "Gesamtdaten:",
        favicon: "/assets/images/logo.png",
        prettyTime: this.getPrettyTime(totalTime),
        percentage: "100",
        visits: totalVisits
      }
      if(sites.length > 0) {
        let bestSite = siteNames[times.indexOf(Math.max(...times))] != "Andere"
        ? siteNames[0]
        : siteNames[1];
        let allData = {
          bestSite,
          firstTime: this.getPrettyDate(first),
          allTime: this.getPrettyTime(sum),
          avgTime: this.getPrettyTime(sum/times.length)
        };
        callback({
          options: {
           tooltips: {
             enabled: false
           },
           responsive: true
          },
         type: 'doughnut',
         legend: true,
         data: [
           {data: times, label: 'Time spent'},
         ],
         labels: siteNames
       }, sites, allData, generalInformation)
      } else {
        callback(null);
      }
    });
  }
  /* Function to check if favicon can be loaded */
  testImage(url: any) : any {
    const imgPromise = new Promise(function imgPromise(resolve, reject) {
      setTimeout(()=>{reject("/assets/images/defaultFavicon.png");}, 100)
      const imgElement = new Image();
      imgElement.onload = () => resolve(url);
      imgElement.onerror = () => reject("/assets/images/defaultFavicon.png");
      imgElement.src = url;
    });
    return imgPromise;
  }
  /* Function to get bar chart data */
  getBarChart(startTime: any, endTime: any, weekTime: any, weekForm: number, callback: Function) {
    if(startTime == undefined || weekTime == undefined) {
      if(weekTime.length > 0) {
        weekTime = weekTime.filter((e: any) => e.stack != weekForm.toString());
      }
      callback({
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
        data: weekTime
      }, weekTime);
    } else {
      let stack = weekForm != undefined ? weekForm : -1;
      if(weekTime.length > 0) {
        weekTime = weekTime.filter((e: any) => e.stack != stack.toString());
      }
      this.apiService.getWebActivitiesInTimespan(startTime.toString(), endTime.toString()).subscribe((timespanData : any) => {
        let week: any[] = [];
        let urls = [];
        let startTime = new Date();
        let counter = weekTime.length;
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
              let others = {time: 0, url: "Andere", startTime: 0, favicon: 'chrome://favicon/'};

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
              if(!weekTime[urls[baseUrl].num]){
                weekTime[urls[baseUrl].num] = {
                  data: [0,0,0,0,0,0,0],
                  label: baseUrl,
                  stack: stack.toString()
                };
              }
              weekTime[urls[baseUrl].num].data[weekIndex] += Math.floor(week[i][j].time/1000/6)/10;
            }
          }
        }
        callback({
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
          data: weekTime
        }, weekTime);
      });
    }
  }
  /* Function to get line chart data */
  getLineChart(startTime: any, endTime: any, monthTime: any, monthForm: any, callback: Function) {
    if(startTime == undefined || endTime == undefined) {
      monthTime = monthTime.filter((e: any) => e.stack != monthForm);
      let labels = [];
      for(let i = 0; i < 31; i++){
        labels[i] = i+1;
      }
      callback({
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
        data: monthTime
      }, monthTime);
    } else {
      this.apiService.getWebActivitiesInTimespan(startTime?.getTime().toString(), endTime?.getTime().toString()).subscribe((timespanData : any) => {
        let monthData: any = [];
        for(let i = 0; i < endTime.getDate(); i++){
          monthData[i] = 0;
        }
        let startTime2 = new Date();
        for(let e of timespanData) {
          startTime2.setTime(e.starttime);
          let dayIndex = startTime2.getDate()-1;
          monthData[dayIndex] += e.endtime - e.starttime;
        }
        for(let i = 0; i < endTime.getDate(); i++){
          monthData[i] = Math.floor(((monthData[i] / 10) / 60) / 60)/100;
        }
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];
        let stack = monthForm != undefined ? monthForm : -1;
        let indexFromStack = monthTime.findIndex((e: any) => e.stack == stack);
        if(monthTime[indexFromStack]) {
          monthTime[indexFromStack] = {
            data: monthData,
            label: monthNames[startTime.getMonth()],
            stack: stack
          };
        } else {
          monthTime.push({
            data: monthData,
            label: monthNames[startTime.getMonth()],
            stack: stack
          });
        }
        let labels = [];
        let noData = true;
        for(let i = 0; i < 31; i++){
          labels[i] = i+1;
          if(monthTime[monthForm].data[i]) noData = false;
        }
        if(noData){
          monthTime[monthForm].data = [];
        }
        callback({
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
          data: monthTime
        }, monthTime);
      });
    }
  }
  /* Function to get time string */
  getPrettyTime(milliseconds: number){
    let totalHours = Math.floor(milliseconds / 1000 / 60 / 60);
    let remainingTime = milliseconds - (totalHours * 60 * 60 * 1000);
    let totalMinutes = Math.floor(remainingTime / 1000 / 60);
    remainingTime = remainingTime - (totalMinutes * 60 * 1000);
    let totalSeconds = Math.floor(remainingTime / 1000);
    return totalHours + "h " + totalMinutes + "m " + totalSeconds + "s";
  }
  /* Function to get date string */
  getPrettyDate(milliseconds: number) {
    let date = new Date(milliseconds);
    let d = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let m = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    return d + "." + m + "." + date.getFullYear();
  }
  /* Function to find index of site */
  findIndexOfSiteWithURL(sites: any[], url: any){
    for(let i=0; i<sites.length; i++){
      let site = sites[i];
      if(typeof site.url !== "undefined" && site.url.localeCompare(url) == 0){
        return i;
      }
    }
    return -1;
  }
  /* Function to get percentage string */
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
  /* Function to set time string */
  setPrettyTime(sites: any[]){
    for(let i=0; i<sites.length; i++){
      sites[i].prettyTime = this.getPrettyTime(sites[i].time);
    }
    return sites;
  }
}