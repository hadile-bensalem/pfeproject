import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiResponse } from '../models/fournisseur.model';
import { Article } from '../models/article.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/articles`;

  getAll(): Observable<Article[]> {
    return this.http
      .get<ApiResponse<Article[]>>(this.baseUrl)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  getById(id: number): Observable<Article | null> {
    return this.http
      .get<ApiResponse<Article>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(res => res.data ?? null),
        catchError(() => of(null))
      );
  }

  getByCode(codeArticle: string): Observable<Article | null> {
    return this.http
      .get<ApiResponse<Article>>(`${this.baseUrl}/code/${encodeURIComponent(codeArticle)}`)
      .pipe(
        map(res => res.data ?? null),
        catchError(() => of(null))
      );
  }

  /** Vérifie si un code ou une désignation (même nom) existe déjà — éviter qu'un article soit saisi deux fois */
  checkDuplicate(codeArticle: string, designation: string, excludeId?: number): Observable<{ codeExists: boolean; designationExists: boolean }> {
    return this.getAll().pipe(
      map(articles => {
        const codeExists = articles.some(
          a => a.codeArticle.toLowerCase().trim() === codeArticle.trim().toLowerCase() && a.id !== excludeId
        );
        const desNorm = designation.trim().toLowerCase();
        const designationExists = desNorm.length >= 1 && articles.some(
          a => a.id !== excludeId && a.designation.trim().toLowerCase() === desNorm
        );
        return { codeExists, designationExists };
      })
    );
  }

  create(payload: Partial<Article>): Observable<Article> {
    return this.http
      .post<ApiResponse<Article>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Article>): Observable<Article> {
    return this.http
      .put<ApiResponse<Article>>(`${this.baseUrl}/${id}`, payload)
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
}
