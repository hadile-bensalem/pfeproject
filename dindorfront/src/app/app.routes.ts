import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
  {
    path: 'employees',
    loadComponent: () => import('./pages/employees/employees-list.component').then(m => m.EmployeesListComponent),
    canActivate: [authGuard]
  },
  // Placeholders pour les autres routes du module employees
  {
    path: 'employees/add',
    loadComponent: () => import('./pages/employees/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees/edit/:id',
    loadComponent: () => import('./pages/employees/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees/details/:id',
    loadComponent: () => import('./pages/employees/employee-details.component').then(m => m.EmployeeDetailsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees/attendance',
    loadComponent: () => import('./pages/employees/employee-attendance.component').then(m => m.EmployeeAttendanceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees/leaves',
    loadComponent: () => import('./pages/employees/employee-leaves.component').then(m => m.EmployeeLeavesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employees/payroll',
    loadComponent: () => import('./pages/employees/employee-payroll.component').then(m => m.EmployeePayrollComponent),
    canActivate: [authGuard]
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'signin',
    loadComponent: () => import('./pages/signin/signin.component').then(m => m.SigninComponent)
  },
  {
    path: 'articles',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/articles/articles.component').then(m => m.ArticlesComponent) }
    ]
  },
  {
    path: 'home',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) }
    ]
  },
  {
    path: 'achat',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/achat/achat.component').then(m => m.AchatComponent) },
      { path: 'facture/new', loadComponent: () => import('./pages/achat/facture-achat-wizard/facture-achat-wizard.component').then(m => m.FactureAchatWizardComponent) }
    ]
  },
  {
    path: 'vente',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/vente/vente.component').then(m => m.VenteComponent) }
    ]
  },
  {
    path: 'stock',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/stock/stock.component').then(m => m.StockComponent) }
    ]
  },
  {
    path: 'etat',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/etat/etat.component').then(m => m.EtatComponent) }
    ]
  },
  {
    path: 'client',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/client/client.component').then(m => m.ClientComponent) },
      { path: 'detail/:id', loadComponent: () => import('./pages/client/client-detail/client-detail.component').then(m => m.ClientDetailComponent) }
    ]
  },
  {
    path: 'fournisseur',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/fournisseurs/fournisseurs.component').then(m => m.FournisseursComponent) }
    ]
  },
  {
    path: 'facture',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/facture/facture.component').then(m => m.FactureComponent) }
    ]
  },
  {
    path: 'tresorerie',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/tresorerie/tresorerie.component').then(m => m.TresorerieComponent) }
    ]
  },
  {
    path: 'fournisseurs',
    loadComponent: () => import('./pages/fournisseurs/fournisseurs.component').then(m => m.FournisseursComponent),
    canActivate: [authGuard]
  },
  {
    path: 'fournisseurs/etat',
    loadComponent: () => import('./pages/fournisseurs/etat-fournisseur/etat-fournisseur.component').then(m => m.EtatFournisseurComponent),
    canActivate: [authGuard]
  },
  {
    path: 'fournisseurs/etat/detail/:id',
    loadComponent: () => import('./pages/fournisseurs/fournisseur-detail-etat/fournisseur-detail-etat.component').then(m => m.FournisseurDetailEtatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'travailleurs',
    loadComponent: () => import('./pages/travailleurs/travailleur-list.component').then(m => m.TravailleurListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'travailleurs/:id/pointage',
    loadComponent: () => import('./pages/travailleurs/pointage.component').then(m => m.PointageComponent),
    canActivate: [authGuard]
  }
];
