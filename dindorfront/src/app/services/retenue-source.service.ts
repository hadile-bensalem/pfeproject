import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RetenueSource } from '../models/retenue-source.model';

const STORAGE_KEY = 'dindor_retenues_source';
const NUMERO_KEY = 'dindor_retenue_numero';

@Injectable({ providedIn: 'root' })
export class RetenueSourceService {
  private getStored(): RetenueSource[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setStored(list: RetenueSource[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  private nextNumero(): string {
    const year = new Date().getFullYear();
    const key = `${NUMERO_KEY}_${year}`;
    let n = 1;
    try {
      const stored = localStorage.getItem(key);
      if (stored) n = parseInt(stored, 10) + 1;
    } catch {}
    localStorage.setItem(key, n.toString());
    return `RS-${year}-${n.toString().padStart(4, '0')}`;
  }

  getAll(): Observable<RetenueSource[]> {
    return of(this.getStored());
  }

  getById(id: number): Observable<RetenueSource | null> {
    const list = this.getStored();
    return of(list.find(r => r.id === id) ?? null);
  }

  create(r: Omit<RetenueSource, 'id' | 'numeroRetenue'>): Observable<RetenueSource> {
    const list = this.getStored();
    const nextId = list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
    const newRetenue: RetenueSource = {
      ...r,
      id: nextId,
      numeroRetenue: this.nextNumero()
    };
    list.unshift(newRetenue);
    this.setStored(list);
    return of(newRetenue);
  }

  delete(id: number): Observable<void> {
    const list = this.getStored().filter(x => x.id !== id);
    this.setStored(list);
    return of(void 0);
  }

  getNextNumero(): string {
    const year = new Date().getFullYear();
    const key = `${NUMERO_KEY}_${year}`;
    let n = 0;
    try {
      const stored = localStorage.getItem(key);
      if (stored) n = parseInt(stored, 10);
    } catch {}
    return `RS-${year}-${(n + 1).toString().padStart(4, '0')}`;
  }
}
