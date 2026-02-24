import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiResponse } from '../models/fournisseur.model';
import { Famille } from '../models/famille.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FamilleService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/familles`;

  getAll(): Observable<Famille[]> {
    return this.http
      .get<ApiResponse<Famille[]>>(this.baseUrl)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  create(f: Omit<Famille, 'id'>): Observable<Famille> {
    return this.http
      .post<ApiResponse<Famille>>(this.baseUrl, { code: f.code, nom: f.nom })
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Famille>): Observable<Famille> {
    return this.http
      .put<ApiResponse<Famille>>(`${this.baseUrl}/${id}`, { code: payload.code, nom: payload.nom })
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
