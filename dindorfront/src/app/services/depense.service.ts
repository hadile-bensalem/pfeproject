import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Depense } from '../models/depense.model';

const STORAGE_KEY = 'dindor_depenses';

@Injectable({ providedIn: 'root' })
export class DepenseService {
  private getStored(): Depense[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setStored(list: Depense[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  getAll(): Observable<Depense[]> {
    return of(this.getStored());
  }

  create(d: Omit<Depense, 'id'>): Observable<Depense> {
    const list = this.getStored();
    const nextId = list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
    const newDepense: Depense = { ...d, id: nextId };
    list.unshift(newDepense);
    this.setStored(list);
    return of(newDepense);
  }

  update(id: number, payload: Partial<Depense>): Observable<Depense> {
    const list = this.getStored();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Dépense introuvable');
    list[idx] = { ...list[idx], ...payload };
    this.setStored(list);
    return of(list[idx]);
  }

  delete(id: number): Observable<void> {
    const list = this.getStored().filter(x => x.id !== id);
    this.setStored(list);
    return of(void 0);
  }
}
