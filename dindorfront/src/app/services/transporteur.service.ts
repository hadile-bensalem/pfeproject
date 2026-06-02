import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Transporteur } from '../models/transporteur.model';

@Injectable({ providedIn: 'root' })
export class TransporteurService {
  private api = `${environment.apiUrl}/transporteur`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Transporteur[]> {
    return this.http.get<any>(this.api).pipe(map(r => r.data ?? []));
  }

  create(data: { nom: string; telephone?: string; cin?: string }): Observable<Transporteur> {
    return this.http.post<any>(this.api, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.api}/${id}`).pipe(map(() => void 0));
  }
}
