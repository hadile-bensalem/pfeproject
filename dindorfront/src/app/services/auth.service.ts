import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http         = inject(HttpClient);
  private router       = inject(Router);
  private tokenService = inject(TokenService);

  private readonly API_URL = environment.apiUrl;

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          const data = response.data;
          this.tokenService.setToken(data.token);
          this.tokenService.setRole(data.role);
          this.tokenService.setAdminInfo(data.user ?? data.admin);
          if (data.refreshToken) {
            this.tokenService.setRefreshToken(data.refreshToken);
          }
        }
      })
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
  }

  redirectAfterLogin(): void {
    const role = this.tokenService.getRole();
    if (role === 'ROLE_EMPLOYE') {
      this.router.navigate(['/employe-portal']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  getCurrentAdmin(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/admin/me`);
  }

  isAuthenticated(): boolean { return this.tokenService.isAuthenticated(); }
  getRole(): string | null   { return this.tokenService.getRole(); }
  getAdminInfo(): AdminInfo | null { return this.tokenService.getAdminInfo(); }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/password-reset/request`, { email });
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/password-reset/confirm`, { token, newPassword, confirmPassword });
  }
}
