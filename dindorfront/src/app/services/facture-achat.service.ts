import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FactureAchat, FactureAchatRequest, RetenueAchatRequest } from '../models/facture-achat.model';

@Injectable({ providedIn: 'root' })
export class FactureAchatService {

  private readonly base = `${environment.apiUrl}/achats`;
  private readonly retenueBase = `${environment.apiUrl}/retenue-source`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<FactureAchat[]> {
    return this.http.get<any>(`${this.base}/factures`).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/factures/${id}`).pipe(map(() => void 0));
  }

  getNextNumero(): Observable<string> {
    return this.http.get<any>(`${this.base}/factures/next-number`)
      .pipe(map(r => r.data));
  }

  create(request: FactureAchatRequest): Observable<FactureAchat> {
    return this.http.post<any>(`${this.base}/factures`, request)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<FactureAchat> {
    return this.http.get<any>(`${this.base}/factures/${id}`)
      .pipe(map(r => r.data));
  }

  createRetenue(request: RetenueAchatRequest): Observable<any> {
    return this.http.post<any>(this.retenueBase, request)
      .pipe(map(r => r.data));
  }

  downloadRetenuePdf(retenueId: number): void {
    this.http.get(`${this.retenueBase}/${retenueId}/pdf`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retenue-source-${retenueId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  downloadFacturePdf(factureId: number, numeroFacture: string): void {
    this.http.get(`${this.base}/factures/${factureId}/pdf`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-achat-${numeroFacture}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
