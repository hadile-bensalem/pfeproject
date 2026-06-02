import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';

/** Mappe un code HTTP vers un message français lisible. */
function mapHttpError(error: HttpErrorResponse): string {
  // Timeout ou absence de réseau (status === 0)
  if (error.status === 0) {
    return 'Service indisponible. Vérifiez votre connexion.';
  }
  const serverMessage: string | undefined =
    error.error?.message || error.error?.data || undefined;
  switch (error.status) {
    case 400:
      return serverMessage || 'Données invalides.';
    case 401:
      return 'Session expirée. Veuillez vous reconnecter.';
    case 403:
      return 'Accès non autorisé.';
    case 404:
      return 'Ressource introuvable.';
    case 409:
      return serverMessage || 'Conflit de données.';
    case 500:
      return 'Erreur serveur. Veuillez réessayer.';
    default:
      return serverMessage || `Erreur HTTP ${error.status}.`;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ne pas rediriger pour les endpoints d'authentification (login, register, google...)
      // → l'erreur doit s'afficher sur la page, pas provoquer une redirection silencieuse
      const isAuthEndpoint = req.url.includes('/auth/');

      if ((error.status === 401 || error.status === 403) && !isAuthEndpoint) {
        tokenService.clearTokens();
        router.navigate(['/login']);
      }

      // Enrichir l'objet d'erreur avec un message français avant de propager
      const friendlyMessage = mapHttpError(error);
      const enrichedError = new HttpErrorResponse({
        error: { ...error.error, friendlyMessage },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined
      });
      return throwError(() => enrichedError);
    })
  );
};
