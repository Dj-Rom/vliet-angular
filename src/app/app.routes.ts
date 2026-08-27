import { Routes } from '@angular/router';
import { AuthGuard } from './core/guard/authguard';

export const routes: Routes = [
  // Default → redirect to sign-in
  { path: '', redirectTo: '/auth/sign-in', pathMatch: 'full' },

  // Authentication routes
  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./auth/sign-in/sign-in').then((m) => m.SignIn),
        data: { title: 'Sign-in' },
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./auth/sign-up/sign-up').then((m) => m.SignUp),
        data: { title: 'Sign-up' },
      },
    ],
  },

  // Main protected app
  {
    path: 'app',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      // Waybills
      {
        path: 'waybill-new',
        loadComponent: () =>
          import('./features/waybiils/layout/waybiils').then((m) => m.WaybiilsPage),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/waybiils/pages/view-waybills-page/view-waybills-page').then(
                (m) => m.ViewWaybillsPage,
              ),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./features/waybiils/pages/add-new-waybill-page/add-new-waybill-page').then(
                (m) => m.AddNewWaybillPage,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/waybiils/pages/edit-waybills-page/edit-waybills-page').then(
                (m) => m.EditWaybillsPage,
              ),
          },
        ],
      },

      // Traffic Information (A2, A12, A30, A10)
      {
        path: 'traffic',
        loadComponent: () =>
          import('./features/traffic-page/traffic').then(
            (m) => m.TrafficComponent,
          ),
        data: { title: 'Ruch drogowy & Korki' },
      },
      {
        path: 'available-capacity',
        redirectTo: 'traffic',
        pathMatch: 'full',
      },

      // Load Management
      {
        path: 'load-management',
        loadComponent: () =>
          import('./features/packaking-manager-page/layout/load-calculator-page').then(
            (m) => m.LoadCalculatorPage,
          ),
        children: [
          { path: '', redirectTo: 'all', pathMatch: 'full' },
          {
            path: 'all',
            loadComponent: () =>
              import('./features/packaking-manager-page/pages/list-page/list-page').then(
                (m) => m.ListPage,
              ),
          },
          {
            path: 'today',
            loadComponent: () =>
              import('./features/packaking-manager-page/pages/list-page/list-page').then(
                (m) => m.ListPage,
              ),
          },
          {
            path: 'add',
            loadComponent: () =>
              import('./features/packaking-manager-page/pages/add-new-list/add-new-list').then(
                (m) => m.AddNewList,
              ),
          },
          {
            path: 'calc/:key',
            loadComponent: () =>
              import('./features/packaking-manager-page/pages/calculator/calculator').then(
                (m) => m.Calculator,
              ),
          },
        ],
      },
      {
        path: 'load-management/edit/:id',
        loadComponent: () =>
          import('./features/packaking-manager-page/pages/edit-item/edit-item').then(
            (m) => m.EditItem,
          ),
      },

      // Load Locations
      {
        path: 'load-location',
        loadComponent: () =>
          import('./features/load-location-page/load-location').then((m) => m.LoadLocation),
        data: { title: 'Load Location' },
      },
      {
        path: 'load-location/add',
        loadComponent: () =>
          import('./features/load-location-page/pages/add-new-client-page/add-new-client-page').then(
            (m) => m.AddNewClientPage,
          ),
        data: { title: 'Load Location' },
      },
      {
        path: 'load-location/edit/:id',
        loadComponent: () =>
          import('./features/load-location-page/pages/edit-client-page/edit-client-page').then(
            (m) => m.EditClientPage,
          ),
        data: { title: 'Edit Client' },
      },

      // Profile
      {
        path: 'profile',
        loadComponent: () => import('./features/profile-page/profile').then((m) => m.Profile),
        data: { title: 'Profile' },
      },

      // Default for app
      { path: '', redirectTo: 'waybill-new', pathMatch: 'full' },
    ],
  },

  // Not Found
  {
    path: 'not-found',
    loadComponent: () => import('./features/not-found-page/not-found').then((m) => m.NotFound),
    data: { title: 'Not found' },
  },
  { path: '**', redirectTo: '/not-found' },
];
