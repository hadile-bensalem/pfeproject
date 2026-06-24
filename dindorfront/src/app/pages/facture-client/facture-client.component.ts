import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { FactureClientService } from '../../services/facture-client.service';
import { ClientService } from '../../services/client.service';
import { ArticleService } from '../../services/article.service';
import { FactureClient, FactureClientStats, RapportPeriodeRow, TopArticleClient, DetailArticleFacture } from '../../models/facture-client.model';
import { Client } from '../../models/client.model';
import { Article } from '../../models/article.model';

@Component({
  selector: 'app-facture-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './facture-client.component.html',
  styleUrl: './facture-client.component.css'
})
export class FactureClientComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  factures: FactureClient[]         = [];
  filteredFactures: FactureClient[] = [];
  articles: Article[]               = [];
  clients: Client[]                 = [];
  stats: FactureClientStats | null  = null;
  selectedFacture: FactureClient | null = null;

  dateDebut   = '';
  dateFin     = '';
  filterMode  = '';
  searchTerm  = '';

  isLoading    = false;
  errorMessage = '';
  nextNumeroFacture = '';

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
  printFacture: FactureClient | null = null;

  // Bénéfice journalier
  beneficeDateDebut = '';
  beneficeDateFin   = '';
  beneficeFactures: FactureClient[] = [];
  beneficeStats: FactureClientStats | null = null;
  beneficeLoading = false;

  // ── Rapport factures par période ──────────────────────────────────────
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

  constructor(
    private factureClientService: FactureClientService,
    private clientService: ClientService,
    private articleService: ArticleService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    this.dateDebut        = firstOfMonth;
    this.dateFin          = todayStr;
    this.beneficeDateDebut = firstOfMonth;
    this.beneficeDateFin   = todayStr;
    this.rapportDateDebut  = firstOfMonth;
    this.rapportDateFin    = todayStr;
    this.buildSaisieHeaderForm();
    this.buildSaisiePaiementForm();
    this.loadAll();
    this.articleService.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: list => this.articles = list ?? [] });
    this.clientService.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: list => this.clients = list ?? [] });
  }

  loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.factureClientService.getFactures(this.dateDebut, this.dateFin, this.filterMode || undefined).pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.factures = list ?? []; this.applySearch(); this.isLoading = false; },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err?.status === 0 ? '⚠ Serveur inaccessible.' : `⚠ Erreur HTTP ${err?.status}.`;
      }
    });
    this.factureClientService.getStats(this.dateDebut, this.dateFin).pipe(takeUntil(this.destroy$)).subscribe({ next: s => this.stats = s });
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredFactures = term
      ? this.factures.filter(f =>
          f.numeroFacture?.toLowerCase().includes(term) ||
          f.clientNom?.toLowerCase().includes(term) ||
          f.clientCode?.toLowerCase().includes(term))
      : [...this.factures];
  }

  resetFiltres(): void {
    const today = new Date();
    this.dateDebut  = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    this.dateFin    = today.toISOString().slice(0, 10);
    this.filterMode = ''; this.searchTerm = '';
    this.loadAll();
  }

  selectFacture(facture: FactureClient): void {
    if (this.selectedFacture?.id === facture.id) { this.selectedFacture = null; return; }
    this.factureClientService.getById(facture.id).subscribe({ next: full => this.selectedFacture = full });
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
    this.saisieHeaderForm.patchValue({ dateFacture: today });
    const lignes = this.saisieLignes;
    while (lignes.length) lignes.removeAt(0);
    lignes.push(this.buildLigneGroup());
    this.buildSaisiePaiementForm();
    this.factureClientService.getNextNumeroFacture().subscribe({
      next: n => this.nextNumeroFacture = n, error: () => this.nextNumeroFacture = '—'
    });
    setTimeout(() => document.getElementById('saisie-facture-client-panel')
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
      dateFacture: [today, Validators.required],
      lignes:      this.fb.array([])
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
    this.factureClientService.getTopArticlesClient(c.id, 10).pipe(takeUntil(this.destroy$))
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
    setTimeout(() => (document.getElementById('facture-client-picker-search') as HTMLInputElement)?.focus(), 80);
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
    this.factureClientService.getLastPrice(a.codeArticle).subscribe({
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
      const el = document.getElementById(`facture-client-${rowIdx}-${fieldId}`) as HTMLInputElement | null;
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
        this.factureClientService.getLastPrice(a.codeArticle).subscribe({
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
    (document.getElementById('facture-client-client') as HTMLElement)?.focus();
  }

  onClientEnter(): void {
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
      dateFacture:    hv.dateFacture,
      clientId:       this.selectedClient?.id ?? null,
      clientCode:     this.selectedClient?.codeClient ?? '',
      clientNom:      this.selectedClient?.nom ?? '',
      clientAdresse:  this.selectedClient?.adresse ?? '',
      clientMF:       this.selectedClient?.matriculeFiscal ?? '',
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

    this.factureClientService.create(request).subscribe({
      next: facture => {
        this.saisieIsSaving = false;
        this.saisieSuccess  = `Facture ${facture.numeroFacture} enregistrée — ${this.formatNum(facture.netAPayer)} DT`;
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

  openPrint(facture: FactureClient): void {
    this.factureClientService.getById(facture.id).subscribe({
      next: full => { this.printFacture = full; this.cdr.detectChanges(); setTimeout(() => window.print(), 600); }
    });
  }

  // ── Suppression ───────────────────────────────────────────────────────

  deleteFacture(facture: FactureClient): void {
    if (!confirm(`Supprimer la facture ${facture.numeroFacture} ?`)) return;
    this.factureClientService.delete(facture.id).subscribe({
      next: () => {
        this.factures = this.factures.filter(f => f.id !== facture.id);
        this.applySearch();
        if (this.selectedFacture?.id === facture.id) this.selectedFacture = null;
        this.factureClientService.getStats(this.dateDebut, this.dateFin).subscribe({ next: s => this.stats = s });
        this.clientService.getAll().subscribe({ next: list => this.clients = list ?? [] });
      }
    });
  }

  setEtatPaiement(facture: FactureClient, etat: string): void {
    this.factureClientService.updateEtatPaiement(facture.id, etat).subscribe({
      next: updated => {
        const idx = this.factures.findIndex(f => f.id === facture.id);
        if (idx >= 0) this.factures[idx].etatPaiement = updated.etatPaiement;
        this.applySearch();
        this.editingEtatId = null;
      }
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

  get totalCA(): number { return this.filteredFactures.reduce((s, f) => s + (f.netAPayer ?? 0), 0); }
  get detailArticles(): DetailArticleFacture[] { return this.stats?.detailArticles ?? []; }

  // ── Bénéfice journalier ───────────────────────────────────────────────

  loadBenefice(): void {
    this.beneficeLoading = true;
    this.factureClientService.getFactures(this.beneficeDateDebut, this.beneficeDateFin).pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.beneficeFactures = list ?? []; this.beneficeLoading = false; }
    });
    this.factureClientService.getStats(this.beneficeDateDebut, this.beneficeDateFin).pipe(takeUntil(this.destroy$)).subscribe({
      next: s => this.beneficeStats = s
    });
  }

  get totalBenefice(): number { return this.beneficeFactures.reduce((s, f) => s + (f.benefice ?? 0), 0); }

  get totalCaBenefice(): number { return this.beneficeFactures.reduce((s, f) => s + (f.netAPayer ?? 0), 0); }

  // ── Rapport factures par période ──────────────────────────────────────

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
    this.factureClientService.getRapportPeriode(this.rapportClientId, this.rapportDateDebut, this.rapportDateFin)
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

    const thDesig = this.rapportDesignations
      .map(d => `<th colspan="2" class="th-desig">${d}</th>`)
      .join('');
    const thSub = this.rapportDesignations
      .map(() => `<th class="th-sub">Qté × PU</th><th class="th-sub">Montant</th>`)
      .join('');

    const dataRows = this.rapportDates.map(date => {
      const cells = this.rapportDesignations.map(d => {
        const cell = this.rapportPivot[date]?.[d];
        if (!cell) return `<td class="td-empty"></td><td class="td-empty"></td>`;
        const pu = cell.qte > 0 ? cell.total / cell.qte : 0;
        return `<td class="td-qtepu">${fmtN(cell.qte)} × ${fmtN(pu)}</td><td class="td-mt">${fmtN(cell.total)}</td>`;
      }).join('');
      return `<tr><td class="td-date">${fmtD(date)}</td>${cells}<td class="td-rowtotal">${fmtN(this.rapportRowTotal(date))}</td></tr>`;
    }).join('');

    const footerCells = this.rapportDesignations.map(d =>
      `<td class="tf-qte">${fmtN(this.rapportColQteTotal(d))}</td><td class="tf-mt">${fmtN(this.rapportColTotal(d))}</td>`
    ).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8">
<title>Rapport Factures — ${this.rapportClientNom}</title>
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
<h2>Rapport Factures par Période</h2>
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
