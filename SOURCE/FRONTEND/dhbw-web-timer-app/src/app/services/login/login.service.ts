import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(public http: HttpClient) { }

  sendLoginRequest(){
    location.replace(this.create_oauth2_url());
  }

  create_oauth2_url() {
    let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    const RESPONSE_TYPE = encodeURIComponent('id_token');
    const STATE = encodeURIComponent('jfkls3n');
    const SCOPE = encodeURIComponent('openid');
    const PROMPT = encodeURIComponent('consent');
  
    let url = `
    https://accounts.google.com/o/oauth2/v2/auth
    ?client_id=${environment.client_id}
    &response_type=${RESPONSE_TYPE}
    &redirect_uri=${environment.redirect_uri}
    &state=${STATE}
    &scope=${SCOPE}
    &prompt=${PROMPT}
    &nonce=${nonce}`;
    return url;
  }

}
