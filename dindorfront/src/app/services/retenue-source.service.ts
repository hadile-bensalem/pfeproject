import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RetenueSource } from '../models/retenue-source.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RetenueSourceService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/retenue-source`;

  // ── CRUD (backend API) ────────────────────────────────────────────────

  getAll(): Observable<RetenueSource[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(r => (r.data as any[]).map(this.mapToModel))
    );
  }

  getById(id: number): Observable<RetenueSource | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(r => this.mapToModel(r.data))
    );
  }

  /**
   * Crée une retenue à la source.
   * Accepte le format plat utilisé par le formulaire etat et le mappe
   * vers le format RetenueSourceRequest attendu par le backend.
   */
  create(payload: any): Observable<RetenueSource> {
    const request = {
      fournisseurId: payload.fournisseurId,
      dateRetenue: payload.dateRetenue,
      lieuRetenue: payload.lot || 'KSIBET',
      lignes: [{
        numeroFacture: payload.numeroFacture || '',
        montantBrut: payload.montantBrut ?? 0,
        tauxRetenue: payload.taux ?? 1,
        ordre: 1
      }]
    };
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(r => this.mapToModel(r.data))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }

  /**
   * Génère un numéro de retenue en prévisualisation (sans appel backend).
   * Format : RS-AAAA-XXXX
   */
  getNextNumero(): string {
    const year = new Date().getFullYear();
    const key = `dindor_retenue_seq_${year}`;
    let n = 0;
    try {
      const stored = localStorage.getItem(key);
      if (stored) n = parseInt(stored, 10);
    } catch {}
    return `RS-${year}-${(n + 1).toString().padStart(4, '0')}`;
  }

  // ── PDF (backend API) ─────────────────────────────────────────────────

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  // ── Mapping backend → modèle frontend ────────────────────────────────

  private mapToModel(r: any): RetenueSource {
    const premiereLigne = r.lignes?.[0];
    return {
      id:                  r.id,
      numeroRetenue:       r.numeroDocument ?? '',
      fournisseurId:       r.fournisseurId,
      fournisseurNom:      r.fournisseurRaisonSociale ?? '',
      fournisseurAdresse:  r.fournisseurAdresse ?? '',
      fournisseurMatricule:r.fournisseurMatricule ?? '',
      fournisseurCodeTVA:  '',
      dateRetenue:         r.dateRetenue ?? '',
      lot:                 r.lieuRetenue ?? '',
      taux:                premiereLigne?.tauxRetenue ?? 0,
      numeroFacture:       premiereLigne?.numeroFacture ?? '',
      montantBrut:         r.totalMontantBrut ?? 0,
      retenue:             r.totalRetenue ?? 0,
      montantNet:          r.totalMontantNet ?? 0,
      libelle:             ''
    };
  }
}
