import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/fournisseur.model';
import { Pointage } from '../models/pointage.model';

@Injectable({
  providedIn: 'root'
})
export class PointageService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/travailleurs`;

  getHistorique(travailleurId: number): Observable<Pointage[]> {
    return this.http
      .get<ApiResponse<Pointage[]>>(`${this.baseUrl}/${travailleurId}/pointages`)
      .pipe(map(res => res.data ?? []));
  }

  create(travailleurId: number, payload: Partial<Pointage>): Observable<Pointage> {
    return this.http
      .post<ApiResponse<Pointage>>(`${this.baseUrl}/${travailleurId}/pointages`, payload)
      .pipe(map(res => res.data));
  }
}

