import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Employee, FichePaie } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/admin/employes`;
  private readonly PORTAL = `${environment.apiUrl}/employe`;

  // ── Admin: Employés CRUD ─────────────────────────────────────────────────

  getAll(): Observable<Employee[]> {
    return this.http.get<any>(`${this.BASE}`).pipe(map(r => r.data ?? []));
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<any>(`${this.BASE}/${id}`).pipe(map(r => r.data));
  }

  create(payload: Partial<Employee> & { motDePasse?: string }): Observable<Employee> {
    return this.http.post<any>(`${this.BASE}`, payload).pipe(map(r => r.data));
  }

  update(id: number, payload: Partial<Employee> & { motDePasse?: string }): Observable<Employee> {
    return this.http.put<any>(`${this.BASE}/${id}`, payload).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.BASE}/${id}`);
  }

  // ── Admin: Fiches de paie ────────────────────────────────────────────────

  getFichesByEmployee(employeId: number): Observable<FichePaie[]> {
    return this.http.get<any>(`${this.BASE}/${employeId}/fiches-paie`).pipe(map(r => r.data ?? []));
  }

  genererFiche(payload: Partial<FichePaie> & { employeId: number }): Observable<FichePaie> {
    return this.http.post<any>(`${this.BASE}/fiches-paie`, payload).pipe(map(r => r.data));
  }

  getFicheById(id: number): Observable<FichePaie> {
    return this.http.get<any>(`${this.BASE}/fiches-paie/${id}`).pipe(map(r => r.data));
  }

  updateStatutFiche(id: number, statut: string, datePaiement?: string): Observable<FichePaie> {
    return this.http.patch<any>(`${this.BASE}/fiches-paie/${id}/statut`, { statut, datePaiement }).pipe(map(r => r.data));
  }

  deleteFiche(id: number): Observable<void> {
    return this.http.delete<any>(`${this.BASE}/fiches-paie/${id}`);
  }

  // ── Portail Employé ──────────────────────────────────────────────────────

  getProfil(): Observable<Employee> {
    return this.http.get<any>(`${this.PORTAL}/profil`).pipe(map(r => r.data));
  }

  getMesFiches(): Observable<FichePaie[]> {
    return this.http.get<any>(`${this.PORTAL}/fiches-paie`).pipe(map(r => r.data ?? []));
  }

  getMaFiche(id: number): Observable<FichePaie> {
    return this.http.get<any>(`${this.PORTAL}/fiches-paie/${id}`).pipe(map(r => r.data));
  }
}
