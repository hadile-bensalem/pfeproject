import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiResponse } from '../models/fournisseur.model';
import { Client } from '../models/client.model';
import { ClientEtat, TransactionClient } from '../models/client.model';
import { AncienFactureClientForm } from '../models/ancien-facture-client.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  getAll(): Observable<Client[]> {
    return this.http
      .get<ApiResponse<Client[]>>(this.baseUrl)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  getById(id: number): Observable<Client | null> {
    return this.http
      .get<ApiResponse<Client>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(res => res.data ?? null),
        catchError(() => of(null))
      );
  }

  create(payload: Partial<Client>): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Client>): Observable<Client> {
    return this.http
      .put<ApiResponse<Client>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0))
      );
  }

  getEtatClients(): Observable<ClientEtat[]> {
    return this.http
      .get<ApiResponse<ClientEtat[]>>(`${this.baseUrl}/etat`)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => this.getAll().pipe(
          map(list => list.map(c => ({
            clientId: c.id,
            codeClient: c.codeClient,
            nomClient: c.nom,
            solde: 0,
            traitementEnCours: 0
          })))
        ))
      );
  }

  getTransactionsByClient(clientId: number): Observable<TransactionClient[]> {
    return this.http
      .get<ApiResponse<TransactionClient[]>>(`${this.baseUrl}/${clientId}/transactions`)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  deleteTransaction(transactionId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${environment.apiUrl}/clients/transactions/${transactionId}`)
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0))
      );
  }

  saveAncienFactureClient(form: AncienFactureClientForm): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.baseUrl}/factures-anciennes`, form)
      .pipe(
        map(res => res.data),
        catchError(() => of(null))
      );
  }
}
