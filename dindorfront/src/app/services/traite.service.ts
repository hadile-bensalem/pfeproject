import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Traite, StatutTraite } from '../models/traite.model';

const STORAGE_KEY = 'dindor_traites';
const ORDRE_KEY = 'dindor_traite_ordre';

@Injectable({
  providedIn: 'root'
})
export class TraiteService {
  private getStored(): Traite[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setStored(traites: Traite[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(traites));
  }

  private nextOrdre(): string {
    let n = 1;
    try {
      const raw = localStorage.getItem(ORDRE_KEY);
      if (raw) n = parseInt(raw, 10) + 1;
    } catch {}
    localStorage.setItem(ORDRE_KEY, n.toString());
    return n.toString().padStart(11, '0');
  }

  getAll(): Observable<Traite[]> {
    return of(this.getStored());
  }

  getById(id: number): Observable<Traite | null> {
    const list = this.getStored();
    return of(list.find(t => t.id === id) ?? null);
  }

  create(traite: Omit<Traite, 'id' | 'ordrePaiement'>): Observable<Traite> {
    const list = this.getStored();
    const nextId = list.length ? Math.max(...list.map(t => t.id)) + 1 : 1;
    const newTraite: Traite = {
      ...traite,
      id: nextId,
      ordrePaiement: this.nextOrdre()
    };
    list.unshift(newTraite);
    this.setStored(list);
    return of(newTraite);
  }

  update(id: number, payload: Partial<Traite>): Observable<Traite> {
    const list = this.getStored();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Traite non trouvée');
    list[idx] = { ...list[idx], ...payload };
    this.setStored(list);
    return of(list[idx]);
  }

  setStatut(id: number, statut: StatutTraite): Observable<Traite> {
    return this.update(id, { statut });
  }

  delete(id: number): Observable<void> {
    const list = this.getStored().filter(t => t.id !== id);
    this.setStored(list);
    return of(void 0);
  }
}
