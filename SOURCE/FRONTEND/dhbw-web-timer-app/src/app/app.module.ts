import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './pages/general/home/home.component';
import { AboutComponent } from './pages/general/about/about.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { StatisticsComponent } from './pages/general/statistics/statistics.component';
import { CommunityComponent } from './pages/general/community/community.component';
import { GeneralComponent } from './pages/general/general.component';
import { ChartsModule } from 'ng2-charts';
import { LoginComponent } from './pages/general/login/login.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTableModule} from "@angular/material/table";
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { RegisterComponent } from './pages/general/register/register/register.component';
import { CookieService } from 'ngx-cookie-service';
registerLocaleData(localeDe);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    FooterComponent,
    NavbarComponent,
    StatisticsComponent,
    CommunityComponent,
    GeneralComponent,
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    MatButtonModule,
    ChartsModule,
    MatTabsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  bootstrap: [AppComponent],
  providers: [
    CookieService,
    { provide: LOCALE_ID, useValue: 'de-DE' },
  ]
})
export class AppModule { }
