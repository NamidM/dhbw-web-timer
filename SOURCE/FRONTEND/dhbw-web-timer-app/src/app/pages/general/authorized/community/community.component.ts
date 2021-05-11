import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StatisticsService } from 'src/app/services/statistics/statistics.service';
import { DeleteDialogComponent } from 'src/app/shared/dialogs/delete-dialog/delete-dialog.component';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit {

  public posts: any = [];
  public sites: any = [];
  public dataSource: any = [];

  public currentPage = 0;
  pageSize: number = 5;
  length: any;

  constructor(private apiService: ApiService, private statisticsService: StatisticsService, private dialog: MatDialog, public authService: AuthService) { }

  public handlePage(e: any) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    const end = (this.currentPage + 1) * this.pageSize;
    const start = this.currentPage * this.pageSize;
    this.dataSource = this.posts.slice(start, end);
  }

  ngOnInit(): void {
    this.apiService.getAllPosts().subscribe((response)=>{
      if(response.message == "success") {
        this.posts = response.posts;
        this.length = response.posts.length;

        for(let i = 0; i<this.posts.length; i++) {
          switch(this.posts[i].type) {
            case 'daily':
              this.statisticsService.showDoughnutChart(this.posts[i].sites, (chart: any, generalInformation: any) => {
                this.posts[i].chart = chart;
                this.posts[i].site = generalInformation;
              });
              let prettyTime: any = new Date(this.posts[i].time);
              let date = prettyTime.getDate() < 9 ? "0" + prettyTime.getDate() : prettyTime.getDate();
              let month = prettyTime.getMonth() < 9 ? "0" + prettyTime.getMonth() : prettyTime.getMonth();
              prettyTime = `${date}.${month}.${prettyTime.getFullYear()}`;
              this.posts[i].typeText = `Tägliche Statistik vom ${prettyTime}`; 
              break;
            case 'weekly':
              this.statisticsService.showBarChart(this.posts[i].timeData, (chart: any) => {
                this.posts[i].chart = chart;
              });
              this.posts[i].typeText = 'Wöchentliche Statistik';
              break;
            case 'monthly':
              this.statisticsService.showLineChart(this.posts[i].timeData, (chart: any) => {
                this.posts[i].chart = chart;
              });  
              this.posts[i].typeText = 'Monatliche Statistik';
              break;
            case 'total':
              this.statisticsService.showDoughnutChart(this.posts[i].sites, (chart: any, generalInformation: any) => {
                this.posts[i].chart = chart;
                this.posts[i].site = generalInformation;
              }); 
              this.posts[i].typeText = 'Gesamt Statistik';
          }

        }
        this.dataSource = this.posts.slice(0, this.pageSize);
      } else {
        this.length = 0;
      }
    });
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }, i:any): void {
    const hovered : any = active[0];
    this.posts[i].site = this.posts[i].sites[hovered._index];
  }

  deletePost(_id: any) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: {message: 'Wollen Sie den Post wirklich löschen?'}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.apiService.deletePost(_id).subscribe(response => {
          if(response.message == "success") {
            this.posts = this.posts.filter((e:any) => e._id != _id);
            this.dataSource = this.dataSource.filter((e:any) => e._id != _id);
            if(this.dataSource.length == 0 && this.currentPage > 0) {
              this.currentPage -= 1;
            }
            this.length = this.length? this.length-1 : 0;
            const end = (this.currentPage + 1) * this.pageSize;
            const start = this.currentPage * this.pageSize;
            this.dataSource = this.posts.slice(start, end);
          }
        });
      }
    });
  }
}