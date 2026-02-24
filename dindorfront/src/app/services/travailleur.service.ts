import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Travailleur } from '../models/travailleur.model';
import { ApiResponse } from '../models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class TravailleurService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/travailleurs`;

  getAll(): Observable<Travailleur[]> {
    return this.http
      .get<ApiResponse<Travailleur[]>>(this.baseUrl)
      .pipe(map(res => res.data ?? []));
  }

  getById(id: number): Observable<Travailleur> {
    return this.http
      .get<ApiResponse<Travailleur>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(payload: Partial<Travailleur>): Observable<Travailleur> {
    return this.http
      .post<ApiResponse<Travailleur>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Travailleur>): Observable<Travailleur> {
    return this.http
      .put<ApiResponse<Travailleur>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}

