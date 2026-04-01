import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { AdminInfo } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);

  adminInfo: AdminInfo | null = null;
  today = new Date();

  get todayLabel(): string {
    return this.today.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  ngOnInit(): void {
    this.adminInfo = this.authService.getAdminInfo();
    if (!this.adminInfo) {
      this.authService.getCurrentAdmin().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.adminInfo = response.data;
            this.tokenService.setAdminInfo(response.data);
          }
        }
      });
    }
  }
}
