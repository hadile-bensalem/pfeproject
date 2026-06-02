import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Traite, StatutTraite } from '../models/traite.model';

const STORAGE_KEY = 'dindor_traites';
const ORDRE_KEY   = 'dindor_traite_ordre';

@Injectable({ providedIn: 'root' })
export class TraiteService {

  private getStored(): Traite[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
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

  getAll(): Observable<Traite[]> { return of(this.getStored()); }

  getById(id: number): Observable<Traite | null> {
    return of(this.getStored().find(t => t.id === id) ?? null);
  }

  create(traite: Omit<Traite, 'id' | 'ordrePaiement'>): Observable<Traite> {
    const list  = this.getStored();
    const newId = list.length ? Math.max(...list.map(t => t.id)) + 1 : 1;
    const t: Traite = { ...traite, id: newId, ordrePaiement: this.nextOrdre() };
    list.unshift(t);
    this.setStored(list);
    return of(t);
  }

  update(id: number, payload: Partial<Traite>): Observable<Traite> {
    const list = this.getStored();
    const idx  = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Traite non trouvée');
    list[idx] = { ...list[idx], ...payload };
    this.setStored(list);
    return of(list[idx]);
  }

  setStatut(id: number, statut: StatutTraite): Observable<Traite> {
    return this.update(id, { statut });
  }

  delete(id: number): Observable<void> {
    this.setStored(this.getStored().filter(t => t.id !== id));
    return of(void 0);
  }

  /** Convertit un montant en toutes lettres (français, dinars tunisiens) */
  static montantEnLettres(n: number): string {
    if (!n || isNaN(n) || n <= 0) return 'Zéro dinar';

    const unite  = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
                    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
                    'dix-sept', 'dix-huit', 'dix-neuf'];
    const diz    = ['', '', 'vingt', 'trente', 'quarante', 'cinquante',
                    'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    function conv(num: number): string {
      if (num === 0) return '';
      if (num < 20)  return unite[num];
      if (num < 100) {
        const d = Math.floor(num / 10), u = num % 10;
        if (d === 7) return diz[6] + (u === 1 ? '-et-onze' : '-' + unite[10 + u]);
        if (d === 9) return diz[8] + (u === 0 ? 's' : '-' + unite[10 + u]);
        if (u === 1 && d !== 8) return diz[d] + '-et-un';
        if (u === 0) return diz[d] + (d === 8 ? 's' : '');
        return diz[d] + '-' + unite[u];
      }
      if (num < 1000) {
        const c = Math.floor(num / 100), r = num % 100;
        return (c === 1 ? 'cent' : unite[c] + ' cent') + (r === 0 ? (c > 1 ? 's' : '') : ' ' + conv(r));
      }
      if (num < 1_000_000) {
        const m = Math.floor(num / 1000), r = num % 1000;
        return (m === 1 ? 'mille' : conv(m) + ' mille') + (r > 0 ? ' ' + conv(r) : '');
      }
      return num.toString();
    }

    const intPart = Math.floor(n);
    const milPart = Math.round((n - intPart) * 1000);
    let res = conv(intPart) + ' dinar' + (intPart > 1 ? 's' : '');
    if (milPart > 0) res += ' et ' + conv(milPart) + ' millime' + (milPart > 1 ? 's' : '');
    return res.charAt(0).toUpperCase() + res.slice(1);
  }
}
