import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Vehicule } from '../models/vehicule.model';

@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private api = `${environment.apiUrl}/vehicule`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Vehicule[]> {
    return this.http.get<any>(this.api).pipe(map(r => r.data ?? []));
  }

  create(data: { immatriculation: string; marque?: string }): Observable<Vehicule> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.api}/${id}`).pipe(map(() => void 0));
  }
}
