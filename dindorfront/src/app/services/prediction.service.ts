import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ArticleSummary {
  designation: string;
  nbVentes: number;
  prixMoyenRecent: number;
  qteTotaleVendue: number;
}

export interface PredictionPoint {
  horizon: number;
  date: string;
  prixPredit: number;
  prixMin: number;
  prixMax: number;
}

export interface ChartPoint {
  date: string;
  prix?: number;
}

/** Points de la courbe prévisionnelle — clés en snake_case transmises telles quelles par Spring */
export interface ForecastPoint {
  date: string;
  prix_predit: number;
  prix_min: number;
  prix_max: number;
}

export interface PredictionResult {
  article: string;
  prixActuel: number;
  predictions: PredictionPoint[];
  tendance: string;
  recommendation: string;
  confiance: number;
  message: string;
  periodeCourante: string;
  historique: ChartPoint[];
  forecastChart: ForecastPoint[];
  modele: string;
  nbPointsDb: number;
  nbPointsExcel: number;
  nbPointsTotal: number;
  // Contexte stock et demande
  stockActuel: number;
  stockMinimum: number;
  quantiteCommandee: number;
  stockNet: number;
  quantiteAAcheter: number;
  stockCritique: boolean;
  demandeHebdoMoyenne: number;
}

export interface ArticleDashboardItem {
  designation: string;
  nbAchats: number;
  prixMoyen: number;
  prixDernier: number;
  prixVariationPct: number;
  stockActuel: number;
  stockMinimum: number;
  stockCritique: boolean;
  stockBas: boolean;
  urgence: 'CRITIQUE' | 'ALERTE' | 'OK';
  tendance: 'hausse' | 'baisse' | 'stable';
  qteTotaleVendue: number;
  demandeHebdoMoyenne: number;
  nbVentes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/prediction`;

  getArticles(): Observable<ApiResponse<ArticleSummary[]>> {
    return this.http.get<ApiResponse<ArticleSummary[]>>(`${this.base}/articles`);
  }

  predict(designation: string): Observable<ApiResponse<PredictionResult>> {
    const params = new HttpParams().set('designation', designation);
    return this.http.get<ApiResponse<PredictionResult>>(`${this.base}/predict`, { params });
  }

  getDashboard(): Observable<ApiResponse<ArticleDashboardItem[]>> {
    return this.http.get<ApiResponse<ArticleDashboardItem[]>>(`${this.base}/tableau-de-bord`);
  }

  getAdvisory(designation: string): Observable<ApiResponse<ArticleDashboardItem | null>> {
    const params = new HttpParams().set('designation', designation);
    return this.http.get<ApiResponse<ArticleDashboardItem | null>>(`${this.base}/advisory`, { params });
  }
}
