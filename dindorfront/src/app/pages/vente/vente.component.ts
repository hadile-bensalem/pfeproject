import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { VenteService } from '../../services/vente.service';
import { ClientService } from '../../services/client.service';
import { ArticleService } from '../../services/article.service';
import { TransporteurService } from '../../services/transporteur.service';
import { VehiculeService } from '../../services/vehicule.service';
import { BonLivraison, RapportPeriodeRow, TopArticleClient, VenteStats, DetailArticleVente } from '../../models/vente.model';
import { Client } from '../../models/client.model';
import { Article } from '../../models/article.model';
import { Transporteur } from '../../models/transporteur.model';
import { Vehicule } from '../../models/vehicule.model';

@Component({
  selector: 'app-vente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vente.component.html',
  styleUrl: './vente.component.css'
})
export class VenteComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  bons: BonLivraison[]         = [];
  filteredBons: BonLivraison[] = [];
  articles: Article[]          = [];
  clients: Client[]            = [];
  transporteurs: Transporteur[] = [];
  vehicules: Vehicule[]         = [];
  stats: VenteStats | null     = null;
  selectedBon: BonLivraison | null = null;

  dateDebut   = '';
  dateFin     = '';
  filterMode  = '';
  searchTerm  = '';

  isLoading    = false;
  errorMessage = '';
  nextNumeroBL = '';

  showSaisiePanel = false;
  saisieHeaderForm!: FormGroup;
  saisiePaiementForm!: FormGroup;
  saisieIsSaving  = false;
  saisieError     = '';
  saisieSuccess   = '';

  // Client sélection
  selectedClientId: number | null = null;
  selectedClient: Client | null = null;
  clientSearch        = '';
  clientSuggestions: Client[] = [];

  // Info stock par ligne
  ligneInfos: Array<{ stockDispo: number; prixAchat: number; dernierPrix: number; found: boolean }> = [];

  currentArticleRef: { code: string; designation: string; unite: string; stockDispo: number; prixAchat: number; dernierPrix: number; found: boolean } | null = null;

  // Article picker
  isArticlePickerOpen = false;
  articlePickerRowIdx = -1;
  articlePickerSearch = '';
  clientTopArticles: TopArticleClient[] = [];

  editingEtatId: number | null = null;

  // Print
  printBL: BonLivraison | null = null;

  // Bénéfice journalier
  beneficeDateDebut = '';
  beneficeDateFin   = '';
  beneficeBons: BonLivraison[] = [];
  beneficeStats: VenteStats | null = null;
  beneficeLoading = false;

  // ── Rapport ventes par période ────────────────────────────────────────
  showRapport          = false;
  rapportClientId: number | null = null;
  rapportDateDebut     = '';
  rapportDateFin       = '';
  rapportLoading       = false;
  rapportError         = '';
  rapportGenerated     = false;
  rapportDesignations: string[]  = [];
  rapportDates:        string[]  = [];
  rapportPivot:        { [date: string]: { [desig: string]: { qte: number; total: number } } } = {};
  rapportClientNom     = '';

  // ── Référentiels transport ─────────────────────────────────────────────
  showReferentiels = false;

  newTransporteurNom = '';
  newTransporteurTel = '';
  newTransporteurCin = '';
  transporteurSaving = false;
  transporteurError  = '';

  newVehiculeImmat  = '';
  newVehiculeMarque = '';
  vehiculeSaving    = false;
  vehiculeError     = '';

  constructor(
    private venteService: VenteService,
    private clientService: ClientService,
    private articleService: ArticleService,
    private transporteurService: TransporteurService,
    private vehiculeService: VehiculeService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.dateDebut        = today;
    this.dateFin          = today;
    this.beneficeDateDebut = today;
    this.beneficeDateFin   = today;
    this.rapportDateDebut  = today;
    this.rapportDateFin    = today;
    this.buildSaisieHeaderForm();
    this.buildSaisiePaiementForm();
    this.loadAll();
    this.articleService.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: list => this.articles = list ?? [] });
    this.clientService.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: list => this.clients = list ?? [] });
    this.loadTransporteurs();
    this.loadVehicules();
  }

  private loadTransporteurs(): void {
    this.transporteurService.getAll().pipe(takeUntil(this.destroy$))
      .subscribe({ next: list => this.transporteurs = list ?? [] });
  }

  private loadVehicules(): void {
    this.vehiculeService.getAll().pipe(takeUntil(this.destroy$))
      .subscribe({ next: list => this.vehicules = list ?? [] });
  }

  loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.venteService.getBons(this.dateDebut, this.dateFin, this.filterMode || undefined).pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.bons = list ?? []; this.applySearch(); this.isLoading = false; },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err?.status === 0 ? '⚠ Serveur inaccessible.' : `⚠ Erreur HTTP ${err?.status}.`;
      }
    });
    this.venteService.getStats(this.dateDebut, this.dateFin).pipe(takeUntil(this.destroy$)).subscribe({ next: s => this.stats = s });
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredBons = term
      ? this.bons.filter(b =>
          b.numeroBL?.toLowerCase().includes(term) ||
          b.clientNom?.toLowerCase().includes(term) ||
          b.clientCode?.toLowerCase().includes(term))
      : [...this.bons];
  }

  resetFiltres(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.dateDebut = today; this.dateFin = today;
    this.filterMode = ''; this.searchTerm = '';
    this.loadAll();
  }

  selectBon(bl: BonLivraison): void {
    if (this.selectedBon?.id === bl.id) { this.selectedBon = null; return; }
    this.venteService.getById(bl.id).subscribe({ next: full => this.selectedBon = full });
  }

  // ── Saisie ────────────────────────────────────────────────────────────

  openSaisie(): void {
    this.showSaisiePanel  = true;
    this.saisieError      = '';
    this.saisieSuccess    = '';
    this.selectedClient     = null;
    this.selectedClientId   = null;
    this.ligneInfos         = [this.emptyLigneInfo()];
    this.currentArticleRef  = null;
    const today = new Date().toISOString().slice(0, 10);
    this.saisieHeaderForm.reset();
    this.saisieHeaderForm.patchValue({ dateBL: today, transporteurId: null, vehiculeId: null });
    const lignes = this.saisieLignes;
    while (lignes.length) lignes.removeAt(0);
    lignes.push(this.buildLigneGroup());
    this.buildSaisiePaiementForm();
    this.venteService.getNextNumeroBL().subscribe({
      next: n => this.nextNumeroBL = n, error: () => this.nextNumeroBL = '—'
    });
    setTimeout(() => document.getElementById('saisie-vente-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  closeSaisie(): void {
    this.showSaisiePanel  = false;
    this.saisieError      = '';
    this.saisieSuccess    = '';
    this.selectedClient    = null;
    this.selectedClientId  = null;
    this.currentArticleRef = null;
  }

  onClientSelectChange(): void {
    this.selectedClient = this.clients.find(c => c.id === this.selectedClientId) ?? null;
  }

  private buildSaisieHeaderForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.saisieHeaderForm = this.fb.group({
      dateBL:        [today, Validators.required],
      transporteurId:[null],
      vehiculeId:    [null],
      lignes:        this.fb.array([])
    });
  }

  private buildSaisiePaiementForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.saisiePaiementForm = this.fb.group({
      modePaiement:     ['ESPECES', Validators.required],
      dateLimiteCredit: [today]
    });
  }

  private buildLigneGroup(): FormGroup {
    return this.fb.group({
      codeArticle:    [''],
      designation:    ['', Validators.required],
      unite:          [''],
      quantite:       [1,  [Validators.required, Validators.min(0.001)]],
      prixUnitaireHT: [0,  [Validators.required, Validators.min(0)]],
      remise:         [0,  [Validators.min(0), Validators.max(100)]],
      tva:            [0,  [Validators.min(0), Validators.max(100)]]
    });
  }

  get saisieLignes(): FormArray { return this.saisieHeaderForm.get('lignes') as FormArray; }

  private emptyLigneInfo() {
    return { stockDispo: 0, prixAchat: 0, dernierPrix: 0, found: false };
  }

  addLigne(): void {
    this.saisieLignes.push(this.buildLigneGroup());
    this.ligneInfos.push(this.emptyLigneInfo());
    setTimeout(() => this.focusCell(this.saisieLignes.length - 1, 'desig'), 50);
  }

  removeLigne(i: number): void {
    if (this.saisieLignes.length > 1) {
      this.saisieLignes.removeAt(i);
      this.ligneInfos.splice(i, 1);
    }
  }

  get saisieStats() {
    let totalBrut = 0, totalRemise = 0, totalTVA = 0;
    for (const ctrl of this.saisieLignes.controls) {
      const v = ctrl.value;
      const brut   = (+v.quantite || 0) * (+v.prixUnitaireHT || 0);
      const remAmt = brut * (+v.remise || 0) / 100;
      totalBrut   += brut;
      totalRemise += remAmt;
      totalTVA    += (brut - remAmt) * (+v.tva || 0) / 100;
    }
    const totalHT = totalBrut - totalRemise;
    return { totalBrut, totalRemise, totalHT, totalTVA, netAPayer: totalHT + totalTVA };
  }

  getLineMontantHT(i: number): number {
    const v = this.saisieLignes.at(i).value;
    return (+v.quantite || 0) * (+v.prixUnitaireHT || 0) * (1 - (+v.remise || 0) / 100);
  }

  get isModeCREDIT(): boolean { return this.saisiePaiementForm.get('modePaiement')?.value === 'CREDIT'; }

  // ── Client autocomplete ───────────────────────────────────────────────

  onClientSearchInput(): void {
    const q = this.clientSearch.trim().toLowerCase();
    if (!q) { this.clientSuggestions = []; return; }
    this.clientSuggestions = this.clients.filter(c =>
      c.nom.toLowerCase().includes(q) || c.codeClient.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  selectClient(c: Client): void {
    this.selectedClient    = c;
    this.clientSearch      = `${c.codeClient} — ${c.nom}`;
    this.clientSuggestions = [];
    this.clientTopArticles = [];
    this.venteService.getTopArticlesClient(c.id, 10).pipe(takeUntil(this.destroy$))
      .subscribe({ next: list => this.clientTopArticles = list ?? [] });
  }

  clearClient(): void {
    this.selectedClient    = null;
    this.clientSearch      = '';
    this.clientSuggestions = [];
    this.clientTopArticles = [];
  }

  // ── Article picker ────────────────────────────────────────────────────

  get filteredArticlesPicker(): Article[] {
    const term = this.articlePickerSearch.toLowerCase().trim();
    if (!term) return this.articles;
    return this.articles.filter(a =>
      a.codeArticle.toLowerCase().includes(term) || a.designation.toLowerCase().includes(term));
  }

  get topArticlesForPicker(): Article[] {
    if (!this.clientTopArticles.length || this.articlePickerSearch.trim()) return [];
    return this.clientTopArticles
      .map(t => this.articles.find(a =>
        (t.codeArticle && t.codeArticle !== '' && a.codeArticle === t.codeArticle) ||
        a.designation.toLowerCase() === t.designation.toLowerCase()
      ))
      .filter((a): a is Article => !!a);
  }

  openArticlePicker(rowIdx: number): void {
    this.articlePickerRowIdx = rowIdx;
    this.articlePickerSearch = '';
    this.isArticlePickerOpen = true;
    setTimeout(() => (document.getElementById('vente-picker-search') as HTMLInputElement)?.focus(), 80);
  }

  closeArticlePicker(): void { this.isArticlePickerOpen = false; this.articlePickerRowIdx = -1; }

  clearLigne(i: number): void {
    this.saisieLignes.at(i).patchValue({
      codeArticle: '', designation: '', unite: '', tva: 0, prixUnitaireHT: 0, quantite: 1, remise: 0
    });
    if (this.ligneInfos.length > i) this.ligneInfos[i] = this.emptyLigneInfo();
    this.currentArticleRef = null;
  }

  selectArticleFromPicker(a: Article): void {
    const idx = this.articlePickerRowIdx;
    this.saisieLignes.at(idx).patchValue({
      codeArticle: a.codeArticle,
      designation: a.designation,
      unite:       a.unite ?? '',
      tva:         a.tva ?? 0
    });
    const stockDispo = (a.stock1 ?? 0) + (a.stock2 ?? 0);
    const prixAchat  = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
    this.venteService.getLastPrice(a.codeArticle).subscribe({
      next: res => {
        const prix = res.found ? res.prix : (a.prixVente && a.prixVente > 0 ? a.prixVente : prixAchat);
        this.saisieLignes.at(idx).patchValue({ prixUnitaireHT: prix });
        while (this.ligneInfos.length <= idx) this.ligneInfos.push(this.emptyLigneInfo());
        const info = { stockDispo, prixAchat, dernierPrix: res.found ? +res.prix : 0, found: res.found };
        this.ligneInfos[idx] = info;
        this.currentArticleRef = { code: a.codeArticle, designation: a.designation, unite: a.unite ?? '', ...info };
      },
      error: () => {
        this.saisieLignes.at(idx).patchValue({ prixUnitaireHT: a.prixVente ?? 0 });
        while (this.ligneInfos.length <= idx) this.ligneInfos.push(this.emptyLigneInfo());
        const info = { stockDispo, prixAchat, dernierPrix: 0, found: false };
        this.ligneInfos[idx] = info;
        this.currentArticleRef = { code: a.codeArticle, designation: a.designation, unite: a.unite ?? '', ...info };
      }
    });
    this.closeArticlePicker();
    setTimeout(() => this.focusCell(idx, 'qte'), 80);
  }

  focusCell(rowIdx: number, fieldId: string): void {
    setTimeout(() => {
      const el = document.getElementById(`vente-${rowIdx}-${fieldId}`) as HTMLInputElement | null;
      if (el) { el.focus(); el.select(); }
    }, 30);
  }

  onCodeEnter(rowIdx: number): void {
    const code = (this.saisieLignes.at(rowIdx).get('codeArticle')?.value ?? '').trim();
    if (code) {
      const a = this.articles.find(x => x.codeArticle.toLowerCase() === code.toLowerCase());
      if (a) {
        this.saisieLignes.at(rowIdx).patchValue({
          designation: a.designation,
          unite:       a.unite ?? '',
          tva:         a.tva ?? 0
        });
        const stockDispo = (a.stock1 ?? 0) + (a.stock2 ?? 0);
        const prixAchat  = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
        this.venteService.getLastPrice(a.codeArticle).subscribe({
          next: res => {
            const current = +(this.saisieLignes.at(rowIdx).get('prixUnitaireHT')?.value ?? 0);
            if (current === 0) {
              this.saisieLignes.at(rowIdx).patchValue({
                prixUnitaireHT: res.found ? res.prix : (a.prixVente && a.prixVente > 0 ? a.prixVente : prixAchat)
              });
            }
            while (this.ligneInfos.length <= rowIdx) this.ligneInfos.push(this.emptyLigneInfo());
            const info = { stockDispo, prixAchat, dernierPrix: res.found ? +res.prix : 0, found: res.found };
            this.ligneInfos[rowIdx] = info;
            this.currentArticleRef = { code: a.codeArticle, designation: a.designation, unite: a.unite ?? '', ...info };
          }
        });
      }
    }
    this.focusCell(rowIdx, 'desig');
  }

  onLastCellEnter(rowIdx: number): void {
    if (rowIdx === this.saisieLignes.length - 1) this.addLigne();
    else this.focusCell(rowIdx + 1, 'code');
  }

  // ── Navigation Entrée header ──────────────────────────────────────────

  onDateEnter(): void {
    (document.getElementById('vente-client') as HTMLElement)?.focus();
  }

  onClientEnter(): void {
    (document.getElementById('vente-transporteur') as HTMLElement)?.focus();
  }

  onTransporteurEnter(): void {
    (document.getElementById('vente-vehicule') as HTMLElement)?.focus();
  }

  onVehiculeEnter(): void {
    this.focusCell(0, 'code');
  }

  // ── Enregistrement ────────────────────────────────────────────────────

  onSaisieSubmit(): void {
    if (this.saisieHeaderForm.invalid) {
      this.saisieHeaderForm.markAllAsTouched();
      this.saisieLignes.controls.forEach(c => (c as FormGroup).markAllAsTouched());
      this.saisieError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.saisieIsSaving = true;
    this.saisieError    = '';

    const hv    = this.saisieHeaderForm.value;
    const pv    = this.saisiePaiementForm.value;
    const stats = this.saisieStats;

    const request: any = {
      dateBL:         hv.dateBL,
      clientId:       this.selectedClient?.id ?? null,
      clientCode:     this.selectedClient?.codeClient ?? '',
      clientNom:      this.selectedClient?.nom ?? '',
      clientAdresse:  this.selectedClient?.adresse ?? '',
      clientMF:       this.selectedClient?.matriculeFiscal ?? '',
      transporteurId: hv.transporteurId || null,
      vehiculeId:     hv.vehiculeId     || null,
      lignes: this.saisieLignes.controls.map((ctrl, i) => {
        const v = ctrl.value;
        return {
          codeArticle:    v.codeArticle || undefined,
          designation:    v.designation,
          unite:          v.unite || undefined,
          quantite:       +v.quantite,
          prixUnitaireHT: +v.prixUnitaireHT,
          remise:         +v.remise || 0,
          tva:            +v.tva    || 0,
          ordre: i + 1
        };
      }),
      paiement: {
        modePaiement:     pv.modePaiement,
        montantPaye:      pv.modePaiement === 'ESPECES' ? stats.netAPayer : 0,
        montantReste:     pv.modePaiement === 'CREDIT'  ? stats.netAPayer : 0,
        dateLimiteCredit: pv.modePaiement === 'CREDIT'  ? pv.dateLimiteCredit : undefined
      }
    };

    this.venteService.create(request).subscribe({
      next: bl => {
        this.saisieIsSaving = false;
        this.saisieSuccess  = `BL ${bl.numeroBL} enregistré — ${this.formatNum(bl.netAPayer)} DT`;
        this.clientService.getAll().subscribe({ next: list => this.clients = list ?? [] });
        setTimeout(() => { this.closeSaisie(); this.loadAll(); }, 2200);
      },
      error: err => {
        this.saisieIsSaving = false;
        const detail = err?.error?.message || err?.message || 'Erreur inconnue';
        this.saisieError = `Erreur [HTTP ${err?.status}] ${detail}`;
      }
    });
  }

  // ── Impression ────────────────────────────────────────────────────────

  openPrint(bl: BonLivraison): void {
    this.venteService.getById(bl.id).subscribe({
      next: full => { this.printBL = full; this.cdr.detectChanges(); setTimeout(() => window.print(), 600); }
    });
  }

  // ── Suppression ───────────────────────────────────────────────────────

  deleteBon(bl: BonLivraison): void {
    if (!confirm(`Supprimer le BL ${bl.numeroBL} ?`)) return;
    this.venteService.delete(bl.id).subscribe({
      next: () => {
        this.bons = this.bons.filter(b => b.id !== bl.id);
        this.applySearch();
        if (this.selectedBon?.id === bl.id) this.selectedBon = null;
        this.venteService.getStats(this.dateDebut, this.dateFin).subscribe({ next: s => this.stats = s });
        this.clientService.getAll().subscribe({ next: list => this.clients = list ?? [] });
      }
    });
  }

  setEtatPaiement(bl: BonLivraison, etat: string): void {
    this.venteService.updateEtatPaiement(bl.id, etat).subscribe({
      next: updated => {
        const idx = this.bons.findIndex(b => b.id === bl.id);
        if (idx >= 0) this.bons[idx].etatPaiement = updated.etatPaiement;
        this.applySearch();
        this.editingEtatId = null;
      }
    });
  }

  // ── CRUD Transporteurs ────────────────────────────────────────────────

  saveTransporteur(): void {
    if (!this.newTransporteurNom.trim()) { this.transporteurError = 'Le nom est obligatoire.'; return; }
    this.transporteurSaving = true;
    this.transporteurError  = '';
    this.transporteurService.create({
      nom:       this.newTransporteurNom.trim(),
      telephone: this.newTransporteurTel.trim() || undefined,
      cin:       this.newTransporteurCin.trim() || undefined
    }).subscribe({
      next: t => {
        this.transporteurs = [...this.transporteurs, t].sort((a, b) => a.nom.localeCompare(b.nom));
        this.newTransporteurNom = '';
        this.newTransporteurTel = '';
        this.newTransporteurCin = '';
        this.transporteurSaving = false;
      },
      error: err => {
        this.transporteurSaving = false;
        this.transporteurError  = err?.error?.message || 'Erreur lors de l\'ajout.';
      }
    });
  }

  deleteTransporteur(t: Transporteur): void {
    if (!confirm(`Supprimer le transporteur « ${t.nom} » ?`)) return;
    this.transporteurService.delete(t.id).subscribe({
      next: () => this.transporteurs = this.transporteurs.filter(x => x.id !== t.id)
    });
  }

  // ── CRUD Véhicules ────────────────────────────────────────────────────

  saveVehicule(): void {
    if (!this.newVehiculeImmat.trim()) { this.vehiculeError = 'L\'immatriculation est obligatoire.'; return; }
    this.vehiculeSaving = true;
    this.vehiculeError  = '';
    this.vehiculeService.create({
      immatriculation: this.newVehiculeImmat.trim(),
      marque:          this.newVehiculeMarque.trim() || undefined
    }).subscribe({
      next: v => {
        this.vehicules = [...this.vehicules, v].sort((a, b) => a.immatriculation.localeCompare(b.immatriculation));
        this.newVehiculeImmat  = '';
        this.newVehiculeMarque = '';
        this.vehiculeSaving    = false;
      },
      error: err => {
        this.vehiculeSaving = false;
        this.vehiculeError  = err?.error?.message || 'Erreur lors de l\'ajout.';
      }
    });
  }

  deleteVehicule(v: Vehicule): void {
    if (!confirm(`Supprimer le véhicule « ${v.immatriculation} » ?`)) return;
    this.vehiculeService.delete(v.id).subscribe({
      next: () => this.vehicules = this.vehicules.filter(x => x.id !== v.id)
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  etatLabel(etat: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'En attente', PARTIEL: 'Partiel', PAYE: 'Payé' };
    return m[etat] ?? etat;
  }

  etatClass(etat: string): string {
    if (etat === 'PAYE')    return 'sp-paye';
    if (etat === 'PARTIEL') return 'sp-partiel';
    return 'sp-en_attente';
  }

  modeLabel(mode: string): string { return mode === 'ESPECES' ? 'Espèces' : 'Crédit'; }

  formatNum(val: number | null | undefined, dec = 3): string {
    if (val == null) return '—';
    return (+val).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  get totalCA(): number { return this.filteredBons.reduce((s, b) => s + (b.netAPayer ?? 0), 0); }
  get detailArticles(): DetailArticleVente[] { return this.stats?.detailArticles ?? []; }

  // ── Bénéfice journalier ───────────────────────────────────────────────

  loadBenefice(): void {
    this.beneficeLoading = true;
    this.venteService.getBons(this.beneficeDateDebut, this.beneficeDateFin).pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.beneficeBons = list ?? []; this.beneficeLoading = false; }
    });
    this.venteService.getStats(this.beneficeDateDebut, this.beneficeDateFin).pipe(takeUntil(this.destroy$)).subscribe({
      next: s => this.beneficeStats = s
    });
  }

  get totalBenefice(): number { return this.beneficeBons.reduce((s, b) => s + (b.benefice ?? 0), 0); }

  get totalCaBenefice(): number { return this.beneficeBons.reduce((s, b) => s + (b.netAPayer ?? 0), 0); }

  // ── Rapport ventes par période ────────────────────────────────────────

  generateRapport(): void {
    if (!this.rapportClientId || !this.rapportDateDebut || !this.rapportDateFin) {
      this.rapportError = 'Veuillez sélectionner un client et une période.';
      return;
    }
    this.rapportLoading   = true;
    this.rapportError     = '';
    this.rapportGenerated = false;
    const client = this.clients.find(c => c.id === this.rapportClientId);
    this.rapportClientNom = client ? `${client.codeClient} — ${client.nom}` : '';
    this.venteService.getRapportPeriode(this.rapportClientId, this.rapportDateDebut, this.rapportDateFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: rows => {
          this.buildPivot(rows);
          this.rapportLoading   = false;
          this.rapportGenerated = true;
        },
        error: () => {
          this.rapportLoading = false;
          this.rapportError   = 'Erreur lors du chargement du rapport.';
        }
      });
  }

  private buildPivot(rows: RapportPeriodeRow[]): void {
    const desigSet = new Set<string>();
    const dateSet  = new Set<string>();
    const pivot: { [date: string]: { [desig: string]: { qte: number; total: number } } } = {};

    for (const row of rows) {
      desigSet.add(row.designation);
      dateSet.add(row.date);
      if (!pivot[row.date]) pivot[row.date] = {};
      const cell = pivot[row.date][row.designation];
      if (cell) {
        cell.qte   += +row.quantite;
        cell.total += +row.totalHT;
      } else {
        pivot[row.date][row.designation] = { qte: +row.quantite, total: +row.totalHT };
      }
    }

    this.rapportDesignations = Array.from(desigSet).sort((a, b) => a.localeCompare(b, 'fr'));
    this.rapportDates        = Array.from(dateSet).sort();
    this.rapportPivot        = pivot;
  }

  rapportCell(date: string, desig: string): { qte: number; total: number } | null {
    return this.rapportPivot[date]?.[desig] ?? null;
  }

  rapportRowTotal(date: string): number {
    const row = this.rapportPivot[date];
    if (!row) return 0;
    return Object.values(row).reduce((s, c) => s + c.total, 0);
  }

  rapportColTotal(desig: string): number {
    return this.rapportDates.reduce((s, d) => s + (this.rapportPivot[d]?.[desig]?.total ?? 0), 0);
  }

  rapportColQteTotal(desig: string): number {
    return this.rapportDates.reduce((s, d) => s + (this.rapportPivot[d]?.[desig]?.qte ?? 0), 0);
  }

  get rapportGrandTotal(): number {
    return this.rapportDates.reduce((s, d) => s + this.rapportRowTotal(d), 0);
  }

  printRapport(): void {
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;

    const fmtN = (v: number) => v.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const fmtD = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

    // Build header row (two sub-rows: designation spans + sub-columns)
    const thDesig = this.rapportDesignations
      .map(d => `<th colspan="2" class="th-desig">${d}</th>`)
      .join('');
    const thSub = this.rapportDesignations
      .map(() => `<th class="th-sub">Qté × PU</th><th class="th-sub">Montant</th>`)
      .join('');

    // Build data rows
    const dataRows = this.rapportDates.map(date => {
      const cells = this.rapportDesignations.map(d => {
        const cell = this.rapportPivot[date]?.[d];
        if (!cell) return `<td class="td-empty"></td><td class="td-empty"></td>`;
        const pu = cell.qte > 0 ? cell.total / cell.qte : 0;
        return `<td class="td-qtepu">${fmtN(cell.qte)} × ${fmtN(pu)}</td><td class="td-mt">${fmtN(cell.total)}</td>`;
      }).join('');
      return `<tr><td class="td-date">${fmtD(date)}</td>${cells}<td class="td-rowtotal">${fmtN(this.rapportRowTotal(date))}</td></tr>`;
    }).join('');

    // Build footer row
    const footerCells = this.rapportDesignations.map(d =>
      `<td class="tf-qte">${fmtN(this.rapportColQteTotal(d))}</td><td class="tf-mt">${fmtN(this.rapportColTotal(d))}</td>`
    ).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8">
<title>Rapport Ventes — ${this.rapportClientNom}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Arial Narrow',Arial,sans-serif; font-size:9pt; color:#1a1a1a; padding:10mm; }
  h2  { font-size:13pt; color:#51000d; margin-bottom:3pt; }
  .sub { font-size:9pt; color:#555; margin-bottom:8pt; }
  table { width:100%; border-collapse:collapse; margin-bottom:8pt; }
  th, td { border:1pt solid #ccc; padding:3pt 5pt; }
  thead tr:first-child th { background:#51000d; color:#fff; text-align:center; font-size:8pt; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .th-desig { background:#745b00; color:#fff; text-align:center; font-size:7.5pt; }
  .th-sub   { background:#5a4500; color:#fff; text-align:center; font-size:7pt; font-weight:400; }
  th[rowspan] { background:#51000d; color:#fff; vertical-align:middle; text-align:center; }
  .td-date    { font-weight:700; color:#51000d; white-space:nowrap; }
  .td-qtepu   { text-align:center; font-size:7.5pt; color:#444; white-space:nowrap; }
  .td-mt      { text-align:right; font-weight:600; }
  .td-rowtotal{ text-align:right; font-weight:700; background:#f5eded; }
  .td-empty   { background:#f8f8f8; }
  tfoot td    { background:#51000d; color:#fff; font-weight:700; text-align:right; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  tfoot .tf-qte { text-align:center; font-size:7.5pt; }
  tfoot .td-label { text-align:center; }
  tfoot .tf-grand { background:#300008; font-size:10pt; }
  .total-box  { text-align:right; font-size:12pt; font-weight:700; color:#51000d; padding:4pt 0; }
  @media print { body { padding:8mm; } }
</style></head><body>
<h2>Rapport Ventes par Période</h2>
<p class="sub">Client : <strong>${this.rapportClientNom}</strong> &nbsp;|&nbsp; Du <strong>${fmtD(this.rapportDateDebut)}</strong> au <strong>${fmtD(this.rapportDateFin)}</strong></p>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="min-width:75pt">Date</th>
      ${thDesig}
      <th rowspan="2" style="min-width:70pt">TOTAL</th>
    </tr>
    <tr>${thSub}</tr>
  </thead>
  <tbody>${dataRows}</tbody>
  <tfoot>
    <tr>
      <td class="td-label">TOTAL</td>
      ${footerCells}
      <td class="tf-grand">${fmtN(this.rapportGrandTotal)}</td>
    </tr>
  </tfoot>
</table>
<p class="total-box">TOTAL GÉNÉRAL : ${fmtN(this.rapportGrandTotal)} DT</p>
</body></html>`;

    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
