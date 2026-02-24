import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RIB } from '../models/rib.model';

const STORAGE_KEY = 'dindor_ribs';

@Injectable({
  providedIn: 'root'
})
export class RibService {
  private getStored(): RIB[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setStored(ribs: RIB[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ribs));
  }

  getAll(): Observable<RIB[]> {
    return of(this.getStored());
  }

  getById(id: number): Observable<RIB | null> {
    const ribs = this.getStored();
    return of(ribs.find(r => r.id === id) ?? null);
  }

  save(rib: Partial<RIB>): Observable<RIB> {
    const ribs = this.getStored();
    const nextId = ribs.length ? Math.max(...ribs.map(r => r.id)) + 1 : 1;
    const newRib: RIB = {
      id: rib.id ?? nextId,
      codeEtablissement: rib.codeEtablissement ?? '',
      codeAgence: rib.codeAgence ?? '',
      numeroCompte: rib.numeroCompte ?? '',
      domiciliation: rib.domiciliation ?? '',
      fournisseurIds: rib.fournisseurIds ?? []
    };
    if (rib.id) {
      const idx = ribs.findIndex(r => r.id === rib.id);
      if (idx !== -1) ribs[idx] = newRib;
    } else {
      ribs.push(newRib);
    }
    this.setStored(ribs);
    return of(newRib);
  }

  delete(id: number): Observable<void> {
    const ribs = this.getStored().filter(r => r.id !== id);
    this.setStored(ribs);
    return of(void 0);
  }

  /** Trouver un RIB par son format affiché (codeEtablissement | codeAgence | numeroCompte) */
  findByFormat(format: string): RIB | null {
    const parts = format.split('|').map(p => p.trim());
    if (parts.length !== 3) return null;
    const ribs = this.getStored();
    return ribs.find(r =>
      r.codeEtablissement === parts[0] &&
      r.codeAgence === parts[1] &&
      r.numeroCompte === parts[2]
    ) ?? null;
  }
}
