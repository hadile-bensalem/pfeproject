import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TraiteService } from '../../services/traite.service';
import { LettreDeChangeService } from '../../services/lettre-de-change.service';
import { Traite, StatutTraite } from '../../models/traite.model';
import { Fournisseur } from '../../models/fournisseur.model';
import { FournisseurService } from '../../services/fournisseur.service';

@Component({
  selector: 'app-traites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './traites.component.html',
  styleUrl: './traites.component.css'
})
export class TraitesComponent implements OnInit {

  traites: Traite[]           = [];
  fournisseurs: Fournisseur[] = [];

  showSaisie = false;

  // Formulaire
  form: Partial<Traite> = {};
  editId: number | null = null;

  // Filtres
  filterStatut = '';
  searchTerm   = '';

  constructor(
    private service:            TraiteService,
    private ldc:                LettreDeChangeService,
    private fournisseurService: FournisseurService
  ) {}

  ngOnInit(): void {
    this.load();
    this.fournisseurService.getAll().subscribe({ next: f => this.fournisseurs = f ?? [] });
  }

  load(): void {
    this.service.getAll().subscribe({ next: list => this.traites = list ?? [] });
  }

  get filtered(): Traite[] {
    return this.traites.filter(t => {
      const matchStatut = !this.filterStatut || t.statut === this.filterStatut;
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        t.ordrePaiement?.toLowerCase().includes(term) ||
        t.fournisseurNom?.toLowerCase().includes(term) ||
        t.nomAdresseTire?.toLowerCase().includes(term);
      return matchStatut && matchSearch;
    });
  }

  openNew(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.editId = null;
    this.form = {
      faitA:           'KSIBET',
      ribCodeEtab:     '08',
      ribCodeAgence:   '505',
      ribNumeroCompte: '00027100209688',
      ribCle:          '7',
      domiciliation:   'BIAT KSIBET EL M.',
      tireur:          'STE DIND\'OR K.M.',
      nomAdresseTire:  'STE DIND\'OR K.M.\nKSIBET EL MEDIOUNI',
      lieuCreation:    'KSIBET',
      dateCreation:    today,
      dateEcheance:    today,
      valeurEn:        'DT',
      montant:         0,
      montantLettres:  '',
      statut:          'non_imprimee'
    };
    this.showSaisie = true;
    setTimeout(() => document.getElementById('t-fournisseur')?.focus(), 100);
  }

  openEdit(t: Traite): void {
    this.editId = t.id;
    this.form   = { ...t };
    this.showSaisie = true;
  }

  closeSaisie(): void {
    this.showSaisie = false;
    this.form = {};
    this.editId = null;
  }

  onMontantChange(): void {
    const val = +(this.form.montant ?? 0);
    this.form.montantLettres = TraiteService.montantEnLettres(val);
  }

  onFournisseurChange(): void {
    const id = +(this.form.fournisseurId ?? 0);
    const f  = this.fournisseurs.find(x => x.id === id);
    if (f) {
      this.form.fournisseurNom  = f.raisonSociale;
      this.form.nomAdresseTire  = f.raisonSociale + (f.adresse ? '\n' + f.adresse : '');
    }
  }

  save(): void {
    if (!this.form.montant || !this.form.dateEcheance) return;
    const payload = { ...this.form } as Omit<Traite, 'id' | 'ordrePaiement'>;
    if (this.editId !== null) {
      this.service.update(this.editId, payload).subscribe({ next: () => { this.load(); this.closeSaisie(); } });
    } else {
      this.service.create(payload).subscribe({ next: () => { this.load(); this.closeSaisie(); } });
    }
  }

  delete(t: Traite): void {
    if (!confirm(`Supprimer la traite N° ${t.ordrePaiement} ?`)) return;
    this.service.delete(t.id).subscribe({ next: () => this.load() });
  }

  imprimer(t: Traite): void {
    this.service.setStatut(t.id, 'imprimee').subscribe({ next: () => this.load() });
    this.ldc.openPrintWindow(t, null, true);
  }

  setStatut(t: Traite, s: StatutTraite): void {
    this.service.setStatut(t.id, s).subscribe({ next: () => this.load() });
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      non_imprimee: 'Non imprimée',
      imprimee:     'Imprimée',
      echue:        'Échue'
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    if (s === 'imprimee')     return 'sp-imprimee';
    if (s === 'echue')        return 'sp-echue';
    return 'sp-non_imprimee';
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  formatNum(v: number | null | undefined): string {
    if (v == null) return '—';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  get totalTraites(): number {
    return this.filtered.reduce((s, t) => s + (t.montant ?? 0), 0);
  }

}
