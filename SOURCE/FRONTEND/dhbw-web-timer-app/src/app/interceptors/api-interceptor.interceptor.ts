import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from "rxjs/operators";
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class ApiInterceptorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService){}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(!req.url.startsWith(environment.baseUrl)) {
      return next.handle(req);
    }
    return next.handle(req).pipe(
      tap(event => {
        if(event instanceof HttpResponse) {
          if(event.body?.logout == true && !req.url.includes("silentLogin")) {
            this.authService.logout();
          }
        }
      })
    );
  }
}