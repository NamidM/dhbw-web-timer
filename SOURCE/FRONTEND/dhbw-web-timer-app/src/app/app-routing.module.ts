import { NgModule } from '@angular/core';
import { ChildActivationEnd, RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/general/about/about.component';
import { CommunityComponent } from './pages/general/community/community.component';
import { GeneralComponent } from './pages/general/general.component';
import { HomeComponent } from './pages/general/home/home.component';
import { StatisticsComponent } from './pages/general/statistics/statistics.component';
import {LoginComponent} from "./pages/general/login/login.component";
import { RegisterComponent } from './pages/general/register/register/register.component';

const routes: Routes = [
  {
    path: '',
    component: GeneralComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'statistics',
        component: StatisticsComponent
      },
      {
        path: 'community',
        component: CommunityComponent
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: RegisterComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
