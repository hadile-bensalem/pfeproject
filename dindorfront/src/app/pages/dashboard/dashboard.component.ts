import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { AdminInfo } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);

  adminInfo: AdminInfo | null = null;

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
