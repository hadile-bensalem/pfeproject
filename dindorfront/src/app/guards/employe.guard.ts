import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const employeGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);

  if (tokenService.isAuthenticated() && tokenService.getRole() === 'ROLE_EMPLOYE') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
