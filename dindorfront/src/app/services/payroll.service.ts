import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payroll } from '../models/payroll.model';
import { ApiResponse } from '../models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/employees`;

  getByEmployee(employeeId: number): Observable<Payroll[]> {
    return this.http
      .get<ApiResponse<Payroll[]>>(`${this.baseUrl}/${employeeId}/payroll`)
      .pipe(map(res => res.data ?? []));
  }

  getForPeriod(employeeId: number, mois: number, annee: number): Observable<Payroll> {
    return this.http
      .get<ApiResponse<Payroll>>(`${this.baseUrl}/${employeeId}/payroll`, {
        params: { mois, annee } as any
      })
      .pipe(map(res => res.data));
  }
}

