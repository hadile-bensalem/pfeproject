import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { FactureClientService } from '../../services/facture-client.service';
import { FactureAchatService } from '../../services/facture-achat.service';
import { FournisseurService } from '../../services/fournisseur.service';
import { ArticleService } from '../../services/article.service';
import { DepenseService } from '../../services/depense.service';
import { ClientService } from '../../services/client.service';

import { FactureClient, FactureClientStats } from '../../models/facture-client.model';
import { FactureAchat } from '../../models/facture-achat.model';
import { FournisseurEtat } from '../../models/fournisseur-etat.model';
import { Article } from '../../models/article.model';
import { Depense, CATEGORIES_DEPENSE, ModePaiementDepense } from '../../models/depense.model';
import { Fournisseur } from '../../models/fournisseur.model';
import { Client } from '../../models/client.model';

export interface ClientRentabilite {
  nom: string;
  clientId: number | null;
  ca: number;
  benefice: number;
  marge: number;
  nbBons: number;
  montantPaye: number;
  montantReste: number;
}

export interface JourBilan {
  date: string;
  ca: number;
  benefice: number;
  depenses: number;
  beneficeNet: number;
  nbBons: number;
}

@Component({
  selector: 'app-tresorerie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './tresorerie.component.html',
  styleUrl: './tresorerie.component.css'
})
export class TresorerieComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly CAISSE_KEY = 'dindor_caisse';

  // ── Période ───────────────────────────────────────────────────────────
  dateDebut = this.today();
  dateFin   = this.today();
  isLoading = false;

  // ── Onglet actif ──────────────────────────────────────────────────────
  activeTab: 'resume' | 'clients' | 'jours' | 'depenses' = 'resume';

  // ── KPIs ventes (source : FactureClientService) ───────────────────────
  stats: FactureClientStats | null = null;
  factures: FactureClient[] = [];

  // ── Bilan financier ───────────────────────────────────────────────────
  valeurStock        = 0;
  creditClients      = 0;
  creditFournisseurs = 0;
  totalDepensesPeriode = 0;
  totalAchatsPeriode   = 0;

  // ── Caisse manuelle ───────────────────────────────────────────────────
  caisseInitiale = 0;
  editingCaisse  = false;
  caisseInput    = 0;

  // ── Breakdowns ────────────────────────────────────────────────────────
  clientsRentabilite: ClientRentabilite[] = [];
  joursBilan: JourBilan[] = [];
  showAllClients = false;
  searchClient   = '';

  // ── Dépenses ──────────────────────────────────────────────────────────
  depenses: Depense[] = [];
  filteredDepenses: Depense[] = [];
  dateDebutDep = this.today();
  dateFinDep   = this.today();
  filterCategorie = '';
  isModalDepOpen  = false;
  isEditingDep    = false;
  depForm!: FormGroup;
  fournisseurs: Fournisseur[] = [];
  categories    = [...CATEGORIES_DEPENSE];
  modesPaiement: ModePaiementDepense[] = ['Espèce', 'Chèque', 'Virement'];

  constructor(
    private fb: FormBuilder,
    private factureClientService: FactureClientService,
    private factureAchatService: FactureAchatService,
    private fournisseurService: FournisseurService,
    private articleService: ArticleService,
    private depenseService: DepenseService,
    private clientService: ClientService
  ) {
    this.initDepForm();
  }

  ngOnInit(): void {
    this.loadCaisse();
    this.fournisseurService.getAll().pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(l => this.fournisseurs = l ?? []);
    this.chargerTout();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Caisse ────────────────────────────────────────────────────────────

  private loadCaisse(): void {
    const saved = localStorage.getItem(this.CAISSE_KEY);
    this.caisseInitiale = saved ? parseFloat(saved) : 0;
  }

  startEditCaisse(): void {
    this.caisseInput = this.caisseInitiale;
    this.editingCaisse = true;
  }

  saveCaisse(): void {
    this.caisseInitiale = Math.max(0, +this.caisseInput || 0);
    localStorage.setItem(this.CAISSE_KEY, this.caisseInitiale.toString());
    this.editingCaisse = false;
  }

  cancelEditCaisse(): void { this.editingCaisse = false; }

  // ── Chargement principal ──────────────────────────────────────────────

  chargerTout(): void {
    this.isLoading = true;
    forkJoin({
      stats:         this.factureClientService.getStats(this.dateDebut, this.dateFin).pipe(catchError(() => of(null))),
      factures:      this.factureClientService.getFactures(this.dateDebut, this.dateFin).pipe(catchError(() => of([]))),
      clients:       this.clientService.getAll().pipe(catchError(() => of([]))),
      facturesAchat: this.factureAchatService.getAll().pipe(catchError(() => of([]))),
      etatFourn:     this.fournisseurService.getEtatFournisseurs().pipe(catchError(() => of([]))),
      articles:      this.articleService.getAll().pipe(catchError(() => of([]))),
      depenses:      this.depenseService.getAll().pipe(catchError(() => of([])))
    }).pipe(takeUntil(this.destroy$)).subscribe(({ stats, factures, clients, facturesAchat, etatFourn, articles, depenses }) => {

      this.stats    = stats;
      this.factures = (factures as FactureClient[])
        .filter(f => f.typeDocument === 'BON_LIVRAISON' || !f.typeDocument);

      // Valeur du stock (PUMP × qté)
      this.valeurStock = (articles as Article[]).reduce((s, a) => {
        const p = (a.pump ?? 0) > 0 ? a.pump : (a.prixAchatHT ?? 0);
        return s + (a.stock1 ?? 0) * p;
      }, 0);

      // Crédit clients
      this.creditClients = (clients as Client[])
        .reduce((s, c) => s + Math.max(0, c.soldeTotalDu ?? 0), 0);

      // Crédit fournisseurs
      this.creditFournisseurs = (etatFourn as FournisseurEtat[])
        .reduce((s, f) => s + Math.max(0, f.solde ?? 0), 0);

      // Achats sur la période
      this.totalAchatsPeriode = (facturesAchat as FactureAchat[])
        .filter(f => f.dateFacture >= this.dateDebut && f.dateFacture <= this.dateFin)
        .reduce((s, f) => s + (f.netAPayer ?? 0), 0);

      // Dépenses
      this.depenses = depenses as Depense[];
      this.applyFiltreDep();
      this.totalDepensesPeriode = this.depenses
        .filter(d => d.date >= this.dateDebut && d.date <= this.dateFin)
        .reduce((s, d) => s + d.montant, 0);

      // Calculs analytiques
      this.buildClientsRentabilite();
      this.buildJoursBilan();

      this.isLoading = false;
    });
  }

  // ── Construction : rentabilité par client ────────────────────────────

  private buildClientsRentabilite(): void {
    const map = new Map<string, ClientRentabilite>();
    for (const f of this.factures) {
      const key = f.clientNom?.trim() || 'Client divers';
      const prev = map.get(key);
      if (prev) {
        prev.ca           += f.netAPayer ?? 0;
        prev.benefice     += f.benefice  ?? 0;
        prev.nbBons       += 1;
        prev.montantPaye  += f.montantPaye  ?? 0;
        prev.montantReste += f.montantReste ?? 0;
      } else {
        map.set(key, {
          nom: key, clientId: f.clientId,
          ca: f.netAPayer ?? 0, benefice: f.benefice ?? 0, marge: 0,
          nbBons: 1, montantPaye: f.montantPaye ?? 0, montantReste: f.montantReste ?? 0
        });
      }
    }
    this.clientsRentabilite = Array.from(map.values())
      .map(c => ({ ...c, marge: c.ca > 0 ? (c.benefice / c.ca) * 100 : 0 }))
      .sort((a, b) => b.ca - a.ca);
  }

  // ── Construction : bilan journalier ──────────────────────────────────

  private buildJoursBilan(): void {
    const map = new Map<string, JourBilan>();

    for (const f of this.factures) {
      const d = f.dateFacture;
      const prev = map.get(d);
      if (prev) {
        prev.ca       += f.netAPayer ?? 0;
        prev.benefice += f.benefice  ?? 0;
        prev.nbBons   += 1;
      } else {
        map.set(d, { date: d, ca: f.netAPayer ?? 0, benefice: f.benefice ?? 0, depenses: 0, beneficeNet: 0, nbBons: 1 });
      }
    }

    for (const dep of this.depenses.filter(d => d.date >= this.dateDebut && d.date <= this.dateFin)) {
      const prev = map.get(dep.date);
      if (prev) {
        prev.depenses += dep.montant;
      } else {
        map.set(dep.date, { date: dep.date, ca: 0, benefice: 0, depenses: dep.montant, beneficeNet: 0, nbBons: 0 });
      }
    }

    this.joursBilan = Array.from(map.values())
      .map(j => ({ ...j, beneficeNet: j.benefice - j.depenses }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Getters calculés ──────────────────────────────────────────────────

  get ca(): number          { return this.stats?.chiffreAffaire ?? 0; }
  get especes(): number     { return this.stats?.montantEspeces ?? 0; }
  get credit(): number      { return this.stats?.montantCredit ?? 0; }
  get nbrBons(): number     { return this.stats?.nombreBons ?? 0; }

  /** Marge brute = bénéfice calculé par le backend (prix vente − coût de revient) */
  get margeBrute(): number  { return this.stats?.benefice ?? 0; }

  /** Bénéfice net = marge brute − dépenses de la période */
  get beneficeNet(): number { return this.margeBrute - this.totalDepensesPeriode; }

  /** Taux de marge en % */
  get tauxMarge(): number   { return this.ca > 0 ? (this.margeBrute / this.ca) * 100 : 0; }

  /** Caisse estimée en fin de période = caisse initiale + espèces encaissées − dépenses en espèces */
  get caisseEstimee(): number {
    const depEspeces = this.depenses
      .filter(d => d.date >= this.dateDebut && d.date <= this.dateFin && d.modePaiement === 'Espèce')
      .reduce((s, d) => s + d.montant, 0);
    return this.caisseInitiale + this.especes - depEspeces;
  }

  /** Solde net global */
  get soldeNet(): number {
    return this.especes + this.valeurStock + this.creditClients
         - this.creditFournisseurs - this.totalDepensesPeriode;
  }

  get clientsFiltres(): ClientRentabilite[] {
    let list = this.clientsRentabilite;
    if (this.searchClient.trim()) {
      const q = this.searchClient.toLowerCase();
      list = list.filter(c => c.nom.toLowerCase().includes(q));
    }
    return this.showAllClients ? list : list.slice(0, 10);
  }

  get totalClientsBenefice(): number {
    return this.clientsRentabilite.reduce((s, c) => s + c.benefice, 0);
  }

  get totalDepenses(): number {
    return this.filteredDepenses.reduce((s, d) => s + d.montant, 0);
  }

  // ── Dépenses CRUD ─────────────────────────────────────────────────────

  private initDepForm(): void {
    this.depForm = this.fb.group({
      id:           [0],
      date:         [this.today(), Validators.required],
      libelle:      ['', Validators.required],
      categorie:    ['', Validators.required],
      montant:      [0, [Validators.required, Validators.min(0.001)]],
      modePaiement: ['Espèce', Validators.required],
      remarque:     ['']
    });
  }

  applyFiltreDep(): void {
    let list = [...this.depenses];
    if (this.dateDebutDep) list = list.filter(d => d.date >= this.dateDebutDep);
    if (this.dateFinDep)   list = list.filter(d => d.date <= this.dateFinDep);
    if (this.filterCategorie) list = list.filter(d => d.categorie === this.filterCategorie);
    this.filteredDepenses = list;
  }

  openAddDep(): void {
    this.isEditingDep = false;
    this.depForm.reset({ id: 0, date: this.today(), libelle: '', categorie: '', montant: 0, modePaiement: 'Espèce', remarque: '' });
    this.isModalDepOpen = true;
  }

  openEditDep(d: Depense): void {
    this.isEditingDep = true;
    this.depForm.patchValue(d);
    this.isModalDepOpen = true;
  }

  closeDep(): void { this.isModalDepOpen = false; }
  closeDepOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.closeDep(); }

  submitDep(): void {
    if (this.depForm.invalid) { this.depForm.markAllAsTouched(); return; }
    const v = this.depForm.value;
    const obs = this.isEditingDep
      ? this.depenseService.update(v.id, { date: v.date, libelle: v.libelle, categorie: v.categorie, montant: +v.montant, modePaiement: v.modePaiement, remarque: v.remarque })
      : this.depenseService.create({ date: v.date, libelle: v.libelle, categorie: v.categorie, montant: +v.montant, modePaiement: v.modePaiement, remarque: v.remarque });
    obs.pipe(takeUntil(this.destroy$)).subscribe(() => { this.closeDep(); this.chargerTout(); });
  }

  deleteDep(d: Depense): void {
    if (!confirm(`Supprimer "${d.libelle}" ?`)) return;
    this.depenseService.delete(d.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.chargerTout());
  }

  exportDepenses(): void {
    const headers = ['Date', 'Libellé', 'Catégorie', 'Montant', 'Mode', 'Remarque'];
    const rows = this.filteredDepenses.map(d => [this.fmt(d.date), d.libelle, d.categorie, d.montant.toFixed(3), d.modePaiement, d.remarque ?? '']);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `depenses_${this.today()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private today(): string { return new Date().toISOString().slice(0, 10); }

  fmt(d: string | null | undefined): string {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  fmtNum(v: number | null | undefined, dec = 3): string {
    if (v == null) return '—';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  isToday(): boolean { return this.dateDebut === this.today() && this.dateFin === this.today(); }

  setPeriode(type: 'today' | 'week' | 'month'): void {
    const now = new Date();
    if (type === 'today') {
      this.dateDebut = this.dateFin = this.today();
    } else if (type === 'week') {
      const d = new Date(now); d.setDate(now.getDate() - 6);
      this.dateDebut = d.toISOString().slice(0, 10);
      this.dateFin   = this.today();
    } else {
      this.dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      this.dateFin   = this.today();
    }
    this.chargerTout();
  }

  margeColor(marge: number): string {
    if (marge >= 20) return 'txt-green';
    if (marge >= 10) return 'txt-gold';
    if (marge >= 0)  return 'txt-orange';
    return 'txt-red';
  }
}
