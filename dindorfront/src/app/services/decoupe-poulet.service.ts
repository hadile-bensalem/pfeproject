import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DecoupePoulet } from '../models/decoupe-poulet.model';

@Injectable({ providedIn: 'root' })
export class DecoupePouletService {

  private readonly api = `${environment.apiUrl}/decoupe-poulet`;

  constructor(private http: HttpClient) {}

  getAll(dateDebut?: string, dateFin?: string): Observable<DecoupePoulet[]> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin)   params = params.set('dateFin',   dateFin);
    return this.http.get<any>(this.api, { params }).pipe(map(r => r.data ?? []));
  }

  getById(id: number): Observable<DecoupePoulet> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<DecoupePoulet> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  update(id: number, data: any): Observable<DecoupePoulet> {
    return this.http.put<any>(`${this.api}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.api}/${id}`).pipe(map(() => void 0));
  }
}
