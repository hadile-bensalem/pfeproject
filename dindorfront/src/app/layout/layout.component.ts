import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { NotificationService, TraiteAlert } from '../services/notification.service';
import { AdminInfo } from '../models/auth.model';
import { environment } from '../../environments/environment';

interface NavItem {
  id: string;
  label: string;
  path: string;
  iconPath: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface ContactMessage {
  id: number;
  nom: string;
  email: string;
  message: string;
  lu: boolean;
  dateEnvoi: string;
}

interface ToastItem {
  id: number;
  alert: TraiteAlert;
  urgency: 'critical' | 'warning' | 'soon';
  exiting: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authService           = inject(AuthService);
  private router                = inject(Router);
  private tokenService          = inject(TokenService);
  private http                  = inject(HttpClient);
  private notificationService   = inject(NotificationService);

  adminInfo: AdminInfo | null = null;
  isLoading = true;
  sidebarCollapsed = false;

  notifCount = 0;
  notifMessages: ContactMessage[] = [];
  showNotifDropdown = false;
  activeNotifTab: 'messages' | 'traites' = 'messages';
  private notifInterval: ReturnType<typeof setInterval> | null = null;

  traiteAlerts: TraiteAlert[] = [];
  showTraiteAlert = false;
  bellShake = false;

  toastItems: ToastItem[] = [];
  private toastCounter = 0;
  private shownAlertKeys = new Set<string>();

  get totalNotifCount(): number {
    return this.notifCount + this.traiteAlerts.length;
  }

  urgencyOf(days: number): 'critical' | 'warning' | 'soon' {
    if (days === 0) return 'critical';
    if (days <= 3)  return 'warning';
    return 'soon';
  }

  urgencyLabel(days: number): string {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    return `Dans ${days}j`;
  }

  navSections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { id: 'home', label: 'Tableau de bord', path: '/home',
          iconPath: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
      ]
    },
    {
      label: 'ACHATS & FOURNISSEURS',
      items: [
        { id: 'achat', label: 'Achat', path: '/achat',
          iconPath: 'M7 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1-15L4.27 2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1v2h2zm0 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z' },
        { id: 'fournisseur', label: 'Fournisseurs', path: '/fournisseur',
          iconPath: 'M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11zM12 9l4 4h-3v4h-2v-4H8l4-4z' },
        { id: 'credit-fournisseurs', label: 'Crédit Fournisseurs', path: '/fournisseurs/etat',
          iconPath: 'M6.5 10h-2v7h2v-7zm5 0h-2v7h2v-7zm8.5 9H2v2h18v-2zm-3.5-9h-2v7h2v-7zM11 1L2 6v2h18V6l-9-5z' },
      ]
    },
    {
      label: 'PRODUCTION',
      items: [
        { id: 'decoupe-poulet', label: 'Découpe Poulet', path: '/decoupe-poulet',
          iconPath: 'M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z' }
      ]
    },
    {
      label: 'VENTES & CLIENTS',
      items: [
        { id: 'facture-client', label: 'Factures Client', path: '/facture-client',
          iconPath: 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z' },
        { id: 'client', label: 'Clients', path: '/client',
          iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
        { id: 'clients-crediteurs', label: 'Crédit Clients', path: '/clients-crediteurs',
          iconPath: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' },
        { id: 'facture', label: 'Bons de Livraison', path: '/facture',
          iconPath: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm11 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z' },
      ]
    },
    {
      label: 'INVENTAIRE',
      items: [
        { id: 'articles', label: 'Articles', path: '/articles',
          iconPath: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z' },
        { id: 'stock', label: 'Stock', path: '/stock',
          iconPath: 'M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z' },
        { id: 'inventaire', label: 'Inventaire', path: '/inventaire',
          iconPath: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' },
        { id: 'etat', label: 'État', path: '/etat',
          iconPath: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
      ]
    },
    {
      label: 'RH',
      items: [
        { id: 'employes', label: 'Employés', path: '/employes',
          iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
      ]
    },
    {
      label: 'GESTION',
      items: [
        { id: 'tresorerie', label: 'Trésorerie', path: '/tresorerie',
          iconPath: 'M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z' },
        { id: 'prediction', label: 'Prédiction IA', path: '/prediction',
          iconPath: 'M19.5 12c0-3.59-2.91-6.5-6.5-6.5S6.5 8.41 6.5 12H5c0-4.42 3.58-8 8-8s8 3.58 8 8c0 3.03-1.69 5.67-4.17 7.03L16 20H8l1.62-2.97C7.19 15.67 5.5 13.03 5.5 12H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-1.5zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
        { id: 'contact-messages', label: 'Messages Contact', path: '/contact-messages',
          iconPath: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z' },
      ]
    }
  ];

  ngOnInit(): void {
    this.adminInfo = this.authService.getAdminInfo();
    this.isLoading = false;
    if (!this.adminInfo) {
      this.authService.getCurrentAdmin().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.adminInfo = response.data;
            this.tokenService.setAdminInfo(response.data);
          }
          this.isLoading = false;
          this.startNotifPolling();
        },
        error: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.startNotifPolling();
    }
  }

  ngOnDestroy(): void {
    if (this.notifInterval) {
      clearInterval(this.notifInterval);
    }
  }

  private startNotifPolling(): void {
    this.fetchNotifications();
    this.checkTraiteAlerts();
    this.notifInterval = setInterval(() => {
      this.fetchNotifications();
      this.checkTraiteAlerts();
    }, 30000);
  }

  checkTraiteAlerts(): void {
    if (!this.tokenService.getToken()) return;
    this.notificationService.getTraitesEcheance().subscribe({
      next: (alerts) => {
        this.traiteAlerts = alerts;
        this.showTraiteAlert = alerts.length > 0;
        for (const a of alerts) {
          const key = `${a.numeroFacture}_${a.dateEcheance}`;
          if (!this.shownAlertKeys.has(key)) {
            this.shownAlertKeys.add(key);
            this.pushToast(a);
          }
        }
        if (alerts.some(a => a.joursRestants === 0)) {
          this.bellShake = true;
          setTimeout(() => this.bellShake = false, 1000);
        }
      },
      error: () => {}
    });
  }

  pushToast(alert: TraiteAlert): void {
    const id = ++this.toastCounter;
    const item: ToastItem = { id, alert, urgency: this.urgencyOf(alert.joursRestants), exiting: false };
    this.toastItems.push(item);
    setTimeout(() => this.dismissToast(id), 7000);
  }

  dismissToast(id: number): void {
    const t = this.toastItems.find(x => x.id === id);
    if (t) {
      t.exiting = true;
      setTimeout(() => { this.toastItems = this.toastItems.filter(x => x.id !== id); }, 400);
    }
  }

  goToTraites(): void {
    this.showNotifDropdown = false;
    this.router.navigate(['/traites']);
  }

  private fetchNotifications(): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    this.http.get<{ success: boolean; data: ContactMessage[] }>(
      `${environment.apiUrl}/admin/contact-messages/nonlus`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifMessages = res.data.slice(0, 5);
          this.notifCount = res.data.length;
        }
      },
      error: () => {}
    });
  }

  toggleNotif(event: Event): void {
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  @HostListener('document:click')
  closeNotifDropdown(): void {
    this.showNotifDropdown = false;
  }

  openMessage(msg: ContactMessage): void {
    this.showNotifDropdown = false;
    this.router.navigate(['/contact-messages']);
  }

  formatNotifDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
