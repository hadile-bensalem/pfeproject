import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  StockArticle, MouvementStock, StockDashboard,
  LotStockResponse, DisponibiliteResult
} from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private api = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<StockDashboard> {
    return this.http.get<any>(`${this.api}/dashboard`).pipe(map(r => r.data));
  }

  getStockArticles(): Observable<StockArticle[]> {
    return this.http.get<any>(`${this.api}/articles`).pipe(map(r => r.data ?? []));
  }

  getMouvements(): Observable<MouvementStock[]> {
    return this.http.get<any>(`${this.api}/mouvements`).pipe(map(r => r.data ?? []));
  }

  getMouvementsByArticle(articleId: number): Observable<MouvementStock[]> {
    return this.http.get<any>(`${this.api}/mouvements/article/${articleId}`)
      .pipe(map(r => r.data ?? []));
  }

  creerAjustement(data: {
    articleId: number; quantite: number; notes?: string; referenceDocument?: string
  }): Observable<MouvementStock> {
    return this.http.post<any>(`${this.api}/ajustement`, data).pipe(map(r => r.data));
  }

  updateSeuilMinimum(articleId: number, valeur: number): Observable<void> {
    return this.http.patch<any>(
      `${this.api}/articles/${articleId}/seuil-minimum?valeur=${valeur}`, {}
    ).pipe(map(() => void 0));
  }

  getLotsArticle(articleId: number): Observable<LotStockResponse[]> {
    return this.http.get<any>(`${this.api}/articles/${articleId}/lots`)
      .pipe(map(r => r.data ?? []));
  }

  getTauxMoyen(articleId: number): Observable<number> {
    return this.http.get<any>(`${this.api}/taux-moyen?articleId=${articleId}`)
      .pipe(map(r => r.data ?? 0));
  }

  verifierDisponibilite(articleId: number, qte: number): Observable<DisponibiliteResult> {
    return this.http.get<any>(
      `${this.api}/disponibilite?articleId=${articleId}&qte=${qte}`
    ).pipe(map(r => r.data));
  }
}
