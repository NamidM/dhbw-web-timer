import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dhbw-web-timer-app';
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(http:HttpClient){
    http.get("http://127.0.0.1:3000/test", this.httpOptions).subscribe((data)=>{
      console.log(data);
    });
  }
}