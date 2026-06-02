import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CaMensuel { mois: number; libelle: string; ca: number; nbBons: number; }
export interface TopClient { nom: string; ca: number; nbBons: number; }
export interface TopArticle { designation: string; qty: number; ca: number; }
export interface RecouvrementStats {
  total: number; payes: number; partiels: number; enAttente: number;
  montantTotal: number; montantRecouvre: number; tauxRecouvrement: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = `${environment.apiUrl}/admin/analytics`;
  constructor(private http: HttpClient) {}

  getCaMensuel(annee: number): Observable<CaMensuel[]> {
    return this.http.get<CaMensuel[]>(`${this.api}/ca-mensuel`, { params: { annee: annee.toString() } });
  }

  getTopClients(dateDebut: string, dateFin: string): Observable<TopClient[]> {
    const params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
    return this.http.get<TopClient[]>(`${this.api}/top-clients`, { params });
  }

  getTopArticles(dateDebut: string, dateFin: string): Observable<TopArticle[]> {
    const params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
    return this.http.get<TopArticle[]>(`${this.api}/top-articles`, { params });
  }

  getRecouvrement(dateDebut: string, dateFin: string): Observable<RecouvrementStats> {
    const params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
    return this.http.get<RecouvrementStats>(`${this.api}/recouvrement`, { params });
  }
}
