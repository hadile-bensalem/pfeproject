import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BonLivraison, RapportPeriodeRow, TopArticleClient, VenteStats } from '../models/vente.model';

@Injectable({ providedIn: 'root' })
export class VenteService {
  private api = `${environment.apiUrl}/vente`;

  constructor(private http: HttpClient) {}

  getNextNumeroBL(): Observable<string> {
    return this.http.get<any>(`${this.api}/bons/next-number`).pipe(map(r => r.data));
  }

  getLastPrice(codeArticle: string): Observable<{ found: boolean; prix: number }> {
    return this.http.get<any>(`${this.api}/last-price/${codeArticle}`);
  }

  getBons(dateDebut?: string, dateFin?: string, modePaiement?: string): Observable<BonLivraison[]> {
    let params = new HttpParams();
    if (dateDebut)    params = params.set('dateDebut', dateDebut);
    if (dateFin)      params = params.set('dateFin', dateFin);
    if (modePaiement) params = params.set('modePaiement', modePaiement);
    return this.http.get<any>(`${this.api}/bons`, { params }).pipe(map(r => r.data ?? []));
  }

  getById(id: number): Observable<BonLivraison> {
    return this.http.get<any>(`${this.api}/bons/${id}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<BonLivraison> {
    return this.http.post<any>(`${this.api}/bons`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.api}/bons/${id}`).pipe(map(() => void 0));
  }

  updateEtatPaiement(id: number, etat: string): Observable<BonLivraison> {
    return this.http.patch<any>(`${this.api}/bons/${id}/etat-paiement?etat=${etat}`, {}).pipe(map(r => r.data));
  }

  getStats(dateDebut?: string, dateFin?: string): Observable<VenteStats> {
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
