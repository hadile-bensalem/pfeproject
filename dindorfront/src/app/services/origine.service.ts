import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiResponse } from '../models/fournisseur.model';
import { Origine } from '../models/origine.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrigineService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/origines`;

  getAll(): Observable<Origine[]> {
    return this.http
      .get<ApiResponse<Origine[]>>(this.baseUrl)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => of([]))
      );
  }

  create(o: Omit<Origine, 'id'>): Observable<Origine> {
    return this.http
      .post<ApiResponse<Origine>>(this.baseUrl, { code: o.code, designation: o.designation })
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Origine>): Observable<Origine> {
    return this.http
      .put<ApiResponse<Origine>>(`${this.baseUrl}/${id}`, {
        code: payload.code,
        designation: payload.designation
      })
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
