import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, AuthResponse, ApiResponse, AdminInfo } from '../models/auth.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  
  private readonly API_URL = 'http://localhost:8099/api';

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse['data']>> {
    return this.http.post<ApiResponse<AuthResponse['data']>>(
      `${this.API_URL}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.tokenService.setToken(response.data.token);
          if (response.data.refreshToken) {
            this.tokenService.setRefreshToken(response.data.refreshToken);
          }
          this.tokenService.setAdminInfo(response.data.admin);
        }
      })
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
  }

  getCurrentAdmin(): Observable<ApiResponse<AdminInfo>> {
    return this.http.get<ApiResponse<AdminInfo>>(`${this.API_URL}/admin/me`);
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  getAdminInfo(): AdminInfo | null {
    return this.tokenService.getAdminInfo();
  }

  requestPasswordReset(email: string): Observable<ApiResponse<{ message: string }>> {
    // Appelle l'API de demande de réinitialisation de mot de passe côté backend
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.API_URL}/password-reset/request`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<ApiResponse<{ message: string }>> {
    // Appelle l'API de confirmation de réinitialisation de mot de passe côté backend
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.API_URL}/password-reset/confirm`,
      { token, newPassword, confirmPassword }
    );
  }
}
