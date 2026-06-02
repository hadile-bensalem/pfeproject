import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { ApiResponse, Fournisseur } from '../models/fournisseur.model';
import { FournisseurEtat, TransactionFournisseur, PaiementFournisseurRequest } from '../models/fournisseur-etat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/fournisseurs`;

  getAll(): Observable<Fournisseur[]> {
    return this.http
      .get<ApiResponse<Fournisseur[]>>(this.baseUrl)
      .pipe(map(res => res.data ?? []));
  }

  getById(id: number): Observable<Fournisseur> {
    return this.http
      .get<ApiResponse<Fournisseur>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(payload: Partial<Fournisseur>): Observable<Fournisseur> {
    return this.http
      .post<ApiResponse<Fournisseur>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Fournisseur>): Observable<Fournisseur> {
    return this.http
      .put<ApiResponse<Fournisseur>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  /** Liste des fournisseurs avec solde et traitement en cours (état récapitulatif) */
  getEtatFournisseurs(): Observable<FournisseurEtat[]> {
    return this.http
      .get<ApiResponse<FournisseurEtat[]>>(`${this.baseUrl}/etat`)
      .pipe(
        map(res => res.data ?? []),
        catchError(err => throwError(() => err))
      );
  }

  /** Historique des transactions d'un fournisseur */
  getTransactionsByFournisseur(fournisseurId: number): Observable<TransactionFournisseur[]> {
    return this.http
      .get<ApiResponse<TransactionFournisseur[]>>(`${this.baseUrl}/${fournisseurId}/transactions`)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  /** Enregistrer un règlement pour un fournisseur */
  addPaiement(fournisseurId: number, payload: PaiementFournisseurRequest): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/${fournisseurId}/paiements`, payload)
      .pipe(map(() => void 0));
  }

  /** Supprimer un règlement fournisseur */
  deletePaiement(paiementId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/paiements/${paiementId}`)
      .pipe(map(() => void 0));
  }
}

