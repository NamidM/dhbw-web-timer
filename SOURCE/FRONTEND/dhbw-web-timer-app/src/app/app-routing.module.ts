import { NgModule } from '@angular/core';
import { ChildActivationEnd, RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/general/about/about.component';
import { CommunityComponent } from './pages/general/community/community.component';
import { GeneralComponent } from './pages/general/general.component';
import { HomeComponent } from './pages/general/home/home.component';
import { StatisticsComponent } from './pages/general/statistics/statistics.component';

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
