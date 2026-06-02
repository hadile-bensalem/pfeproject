import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TraiteAlert {
  factureId:     number;
  numeroFacture: string;
  numeroTraite:  string;
  fournisseur:   string;
  montant:       number;
  dateEcheance:  string;
  joursRestants: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getTraitesEcheance(): Observable<TraiteAlert[]> {
    return this.http
      .get<{ success: boolean; data: TraiteAlert[] }>(`${this.base}/traites-echeance`)
      .pipe(map(r => r.data));
  }
}
