import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Client, PaiementClient } from '../models/client.model';
import { BonLivraison } from '../models/vente.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private api = `${environment.apiUrl}/admin/clients`;
  private creditApi = `${environment.apiUrl}/admin/clients-crediteurs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.api);
  }

  getActifs(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api}/actifs`);
  }

  search(q: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api}/search`, { params: { q } });
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.api}/${id}`);
  }

  create(data: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.api, data);
  }

  update(id: number, data: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  // ── Crédit ────────────────────────────────────────────────────────────

  getAllWithSolde(): Observable<Client[]> {
    return this.http.get<Client[]>(this.creditApi);
  }

  getBonsByClient(clientId: number): Observable<BonLivraison[]> {
    return this.http.get<BonLivraison[]>(`${this.creditApi}/${clientId}/bons`);
  }

  getPaiementsByClient(clientId: number): Observable<PaiementClient[]> {
    return this.http.get<PaiementClient[]>(`${this.creditApi}/${clientId}/paiements`);
  }

  addPaiement(clientId: number, data: Partial<PaiementClient>): Observable<PaiementClient> {
    return this.http.post<PaiementClient>(`${this.creditApi}/${clientId}/paiements`, data);
  }

  deletePaiement(clientId: number, paiementId: number): Observable<any> {
    return this.http.delete(`${this.creditApi}/${clientId}/paiements/${paiementId}`);
  }
}
