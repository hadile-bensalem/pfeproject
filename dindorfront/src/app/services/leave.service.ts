import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Leave } from '../models/leave.model';
import { ApiResponse } from '../models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/employees`;

  getByEmployee(employeeId: number): Observable<Leave[]> {
    return this.http
      .get<ApiResponse<Leave[]>>(`${this.baseUrl}/${employeeId}/leaves`)
      .pipe(map(res => res.data ?? []));
  }

  create(employeeId: number, payload: Partial<Leave>): Observable<Leave> {
    return this.http
      .post<ApiResponse<Leave>>(`${this.baseUrl}/${employeeId}/leaves`, payload)
      .pipe(map(res => res.data));
  }
}

