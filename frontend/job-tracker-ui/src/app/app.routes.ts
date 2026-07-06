import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then((m) => m.Dashboard),
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./features/applications/applications')
        .then((m) => m.Applications),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics')
        .then((m) => m.Analytics),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile')
        .then((m) => m.Profile),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];