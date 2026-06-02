import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FactureClient, FactureClientStats, RapportPeriodeRow, TopArticleClient } from '../models/facture-client.model';

@Injectable({ providedIn: 'root' })
export class FactureClientService {
  private api = `${environment.apiUrl}/facture-client`;

  constructor(private http: HttpClient) {}

  getNextNumeroFacture(): Observable<string> {
    return this.http.get<any>(`${this.api}/next-number`).pipe(map(r => r.data));
  }

  getLastPrice(codeArticle: string): Observable<{ found: boolean; prix: number }> {
    return this.http.get<any>(`${this.api}/last-price/${codeArticle}`);
  }

  getFactures(dateDebut?: string, dateFin?: string, modePaiement?: string, typeDocument?: string): Observable<FactureClient[]> {
    let params = new HttpParams();
    if (dateDebut)     params = params.set('dateDebut', dateDebut);
    if (dateFin)       params = params.set('dateFin', dateFin);
    if (modePaiement)  params = params.set('modePaiement', modePaiement);
    if (typeDocument)  params = params.set('typeDocument', typeDocument);
    return this.http.get<any>(this.api, { params }).pipe(map(r => r.data ?? []));
  }

  getNextNumeroBL(): Observable<string> {
    return this.http.get<any>(`${this.api}/next-number-bl`).pipe(
      map(r => r.data ?? ''),
    );
  }

  getById(id: number): Observable<FactureClient> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<FactureClient> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.api}/${id}`).pipe(map(() => void 0));
  }

  updateEtatPaiement(id: number, etat: string): Observable<FactureClient> {
    const params = new HttpParams().set('etat', etat);
    return this.http.patch<any>(`${this.api}/${id}/etat-paiement`, {}, { params }).pipe(map(r => r.data));
  }

  getStats(dateDebut?: string, dateFin?: string): Observable<FactureClientStats> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin)   params = params.set('dateFin', dateFin);
    return this.http.get<any>(`${this.api}/stats`, { params }).pipe(map(r => r.data));
  }

  getTopArticlesClient(clientId: number, limit = 10): Observable<TopArticleClient[]> {
    return this.http.get<any>(`${this.api}/top-articles-client/${clientId}?limit=${limit}`)
      .pipe(map(r => r.data ?? []));
  }

  getRapportPeriode(clientId: number, dateDebut: string, dateFin: string): Observable<RapportPeriodeRow[]> {
    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.get<any>(`${this.api}/rapport-periode`, { params }).pipe(map(r => r.data ?? []));
  }
}
