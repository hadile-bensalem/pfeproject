import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY         = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY          = 'user_info';
  private readonly ROLE_KEY          = 'user_role';

  // ── Token ──────────────────────────────────────────────────────────────
  setToken(token: string): void        { localStorage.setItem(this.TOKEN_KEY, token); }
  getToken(): string | null            { return localStorage.getItem(this.TOKEN_KEY); }

  setRefreshToken(rt: string): void    { localStorage.setItem(this.REFRESH_TOKEN_KEY, rt); }
  getRefreshToken(): string | null     { return localStorage.getItem(this.REFRESH_TOKEN_KEY); }

  // ── Role ───────────────────────────────────────────────────────────────
  setRole(role: string): void          { localStorage.setItem(this.ROLE_KEY, role); }
  getRole(): string | null             { return localStorage.getItem(this.ROLE_KEY); }

  // ── User info ──────────────────────────────────────────────────────────
  setAdminInfo(user: any): void        { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); }
  getAdminInfo(): any | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  // ── Session ────────────────────────────────────────────────────────────
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch { return true; }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }
}
