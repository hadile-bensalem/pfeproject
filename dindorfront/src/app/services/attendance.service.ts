import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Attendance } from '../models/attendance.model';
import { ApiResponse } from '../models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/employees`;

  getByEmployee(employeeId: number): Observable<Attendance[]> {
    return this.http
      .get<ApiResponse<Attendance[]>>(`${this.baseUrl}/${employeeId}/attendance`)
      .pipe(map(res => res.data ?? []));
  }

  create(employeeId: number, payload: Partial<Attendance>): Observable<Attendance> {
    return this.http
      .post<ApiResponse<Attendance>>(`${this.baseUrl}/${employeeId}/attendance`, payload)
      .pipe(map(res => res.data));
  }
}

