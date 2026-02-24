import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Employee } from '../models/employee.model';
import { ApiResponse } from '../models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/employees`;

  getAll(): Observable<Employee[]> {
    return this.http
      .get<ApiResponse<Employee[]>>(this.baseUrl)
      .pipe(map(res => res.data ?? []));
  }

  getById(id: number): Observable<Employee> {
    return this.http
      .get<ApiResponse<Employee>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(payload: Partial<Employee>): Observable<Employee> {
    return this.http
      .post<ApiResponse<Employee>>(this.baseUrl, payload)
      .pipe(map(res => res.data));
  }

  update(id: number, payload: Partial<Employee>): Observable<Employee> {
    return this.http
      .put<ApiResponse<Employee>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}

