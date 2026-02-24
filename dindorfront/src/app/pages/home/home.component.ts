import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { AdminInfo } from '../../models/auth.model';

interface MenuItem {
  id: string;
  label: string;
  iconPath: string;
  path?: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  adminInfo: AdminInfo | null = null;
  isLoading = true;
  sidebarCollapsed = false;
  activeMenuItem: string = '';

  menuItems: MenuItem[] = [
    { id: 'achat', label: 'Achat', iconPath: 'M7 18C8.1 18 9 17.1 9 16C9 14.9 8.1 14 7 14C5.9 14 5 14.9 5 16C5 17.1 5.9 18 7 18ZM1 2V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.5C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C18.1 18 19 17.1 19 16C19 14.9 18.1 14 17 14C15.9 14 15 14.9 15 16C15 17.1 15.9 18 17 18Z' },
    {
      id: 'article',
      label: 'Article',
      // Icône type "document / article"
      iconPath: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM13 9V3.5L18.5 9H13Z',
      path: '/articles'
    },
    { id: 'vente', label: 'Vente', iconPath: 'M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z' },
    { id: 'stock', label: 'Stock', iconPath: 'M20 6H17V4C17 2.9 16.1 2 15 2H9C7.9 2 7 2.9 7 4V6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM9 4H15V6H9V4ZM20 19H4V8H20V19Z' },
    { id: 'etat', label: 'État', iconPath: 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z' },
    { id: 'client', label: 'Client', iconPath: 'M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z' },
    { id: 'fournisseurs', label: 'Fournisseurs', iconPath: 'M20 6H17V4C17 2.9 16.1 2 15 2H9C7.9 2 7 2.9 7 4V6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM9 4H15V6H9V4ZM20 19H4V8H20V19ZM12 9L16 13H13V17H11V13H8L12 9Z', path: '/fournisseurs' },
    { id: 'travailleur', label: 'Travailleur', iconPath: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z', path: '/employees' },
    { id: 'facture', label: 'Facture', iconPath: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z' },
    { id: 'tresorerie', label: 'Trésorerie', iconPath: 'M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 14.2 7.75 14.2 8.9H16.1C16.1 6.36 14.3 4.5 11.5 4.5C8.7 4.5 6.9 6.26 6.9 8.75C6.9 11.1 8.5 12.1 10.9 12.7C13.4 13.3 14.1 14.1 14.1 15.1C14.1 16.2 13.1 17 11.3 17C9.32 17 8.2 16.05 8.2 14.9H6.3C6.3 17.54 8.1 19.5 11.3 19.5C14.5 19.5 16.7 17.44 16.7 15.1C16.7 12.6 14.9 11.5 11.8 10.9ZM3 3H21V5H3V3ZM3 19H21V21H3V19Z' }
  ];

  ngOnInit(): void {
    this.loadAdminInfo();
  }

  loadAdminInfo(): void {
    this.adminInfo = this.authService.getAdminInfo();
    this.isLoading = false;

    // Si pas d'info en cache, récupérer depuis l'API
    if (!this.adminInfo) {
      this.authService.getCurrentAdmin().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.adminInfo = response.data;
            this.tokenService.setAdminInfo(response.data);
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.logout();
        }
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  selectMenuItem(item: MenuItem): void {
    this.activeMenuItem = item.id;
    if (item.path) {
      this.router.navigate([item.path]);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
