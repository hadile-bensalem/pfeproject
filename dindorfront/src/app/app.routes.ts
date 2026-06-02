import { Routes } from '@angular/router';
import { authGuard }   from './guards/auth.guard';
import { adminGuard }  from './guards/admin.guard';
import { employeGuard } from './guards/employe.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
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
    path: 'articles',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/articles/articles.component').then(m => m.ArticlesComponent) }
    ]
  },
  {
    path: 'inventaire',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/inventaire/inventaire.component').then(m => m.InventaireComponent) }
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
      { path: 'facture/new', loadComponent: () => import('./pages/achat/facture-achat-wizard/facture-achat-wizard.component').then(m => m.FactureAchatWizardComponent) },
      { path: 'facture/edit/:id', loadComponent: () => import('./pages/achat/facture-achat-wizard/facture-achat-wizard.component').then(m => m.FactureAchatWizardComponent) }
    ]
  },
  {
    path: 'client',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/client/client.component').then(m => m.ClientComponent) }
    ]
  },
  {
    path: 'clients-crediteurs',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/clients-crediteurs/clients-crediteurs.component').then(m => m.ClientsCrediteurComponent) }
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
    path: 'facture-client',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/facture-client/facture-client.component').then(m => m.FactureClientComponent) }
    ]
  },
  {
    path: 'decoupe-poulet',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/decoupe-poulet/decoupe-poulet.component').then(m => m.DecoupePouletComponent) }
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
    path: 'fournisseurs/etat',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/fournisseurs/etat-fournisseur/etat-fournisseur.component').then(m => m.EtatFournisseurComponent) }
    ]
  },
  {
    path: 'fournisseurs/etat/detail/:id',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/fournisseurs/fournisseur-detail-etat/fournisseur-detail-etat.component').then(m => m.FournisseurDetailEtatComponent) }
    ]
  },
  {
    path: 'prediction',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/prediction/prediction.component').then(m => m.PredictionComponent) }
    ]
  },
  {
    path: 'contact-messages',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/contact-messages/contact-messages.component').then(m => m.ContactMessagesComponent) }
    ]
  },
  {
    path: 'employes',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/employes/employes.component').then(m => m.EmployesComponent) }
    ]
  },
  {
    path: 'traites',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/traites/traites.component').then(m => m.TraitesComponent) }
    ]
  },
  {
    path: 'employe-portal',
    loadComponent: () => import('./pages/employe-portal/employe-portal.component').then(m => m.EmployePortalComponent),
    canActivate: [employeGuard]
  }
];
