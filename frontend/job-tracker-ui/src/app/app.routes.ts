import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/dashboard/dashboard';
import { Applications } from './features/applications/applications';
import { Analytics } from './features/analytics/analytics';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: '',
    component: MainLayout,
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'applications',
        component: Applications
      },
      {
        path: 'analytics',
        component: Analytics
      },
      {
        path: 'profile',
        component: Profile
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
