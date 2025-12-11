import { Routes } from '@angular/router';
import { AuthGuard } from './authguard';

export const routes: Routes = [
  // Redirect root → login
  {
    path: '',
    redirectTo: '/auth/sign-in',
    pathMatch: 'full'
  },

  // Auth pages
  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        loadComponent: () =>
          import('./core/auth/sign-in/sign-in').then(m => m.SignIn),
        data: { title: 'Sign-in' }
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./core/auth/sign-up/sign-up').then(m => m.SignUp),
        data: { title: 'Sign-up' }
      }
    ]
  },

  // Main app (protected)
  {
    path: 'app',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'waybill',
        loadComponent: () =>
          import('./core/waybill/waybill').then(m => m.Waybill),
        data: { title: 'Waybill' }
      },
      {
        path: 'time-counter',
        loadComponent: () =>
          import('./core/time-counter/time-counter').then(m => m.TimeCounter),
        data: { title: 'Time Counter' }
      },
      {
        path: 'load-management',

        loadComponent: () =>
          import('./core/load-calculator-page/load-calculator-page')
            .then(m => m.LoadCalculatorPage),
        children: [
          {
            path: 'all',
            loadComponent: () =>
              import('./core/load-calculator-page/all/all').then(m => m.All)
          },
          {
            path: 'today',
            loadComponent: () =>
              import('./core/load-calculator-page/today/today').then(m => m.Today)
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./core/load-calculator/add-new-list/add-new-list').then(m => m.AddNewList)
          },
        ]
      },
          {
            path: 'load-management/edit/:id',
            loadComponent: () =>
              import('./core/load-calculator/edit-item/edit-item').then(m => m.EditItem)
          },

      {
        path: 'load-location',
        loadComponent: () =>
          import('./core/load-location/load-location').then(m => m.LoadLocation),
        data: { title: 'Load Location' }
      },
      {
        path: 'waybills-history',
        loadComponent: () =>
          import('./core/waybill-history/waybill-history').then(m => m.WaybillHistory),
        data: { title: 'Waybill History' }
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./core/profile/profile').then(m => m.Profile),
        data: { title: 'Profile' }
      },

      {
        path: '',
        redirectTo: 'waybill',
        pathMatch: 'full'
      }
    ]
  },

  // Not found page
  {
    path: 'not-found',
    loadComponent: () =>
      import('./core/not-found/not-found').then(m => m.NotFound),
    data: { title: 'Not found' }
  },

  // Wildcard MUST be last
  // {
  //   path: '**',
  //   redirectTo: '/not-found'
  // }
];
