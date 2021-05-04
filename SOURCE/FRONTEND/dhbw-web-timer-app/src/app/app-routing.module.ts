import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/general/about/about.component';
import { GeneralComponent } from './pages/general/general.component';
import { HomeComponent } from './pages/general/authorized/home/home.component';
import { StatisticsComponent } from './pages/general/authorized/statistics/statistics.component';
import {LoginComponent} from "./pages/general/login/login.component";
import { RegisterComponent } from './pages/general/register/register.component';
import { SettingsComponent } from './pages/general/authorized/settings/settings.component';
import { AuthorizedComponent } from './pages/general/authorized/authorized.component';
import { CommunityComponent } from './pages/general/authorized/community/community.component';

const routes: Routes = [
  {
    path: '',
    component: GeneralComponent,
    children: [
      {
        path: 'about',
        component: AboutComponent
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: RegisterComponent
      },
      {
        path: '',
        component: AuthorizedComponent,
        children: [
          {
            path: 'statistics',
            component: StatisticsComponent
          },
          {
            path: 'settings',
            component: SettingsComponent
          },
          {
            path: 'community',
            component: CommunityComponent
          },
          {
            path: '',
            component: HomeComponent
          },
        ]
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
