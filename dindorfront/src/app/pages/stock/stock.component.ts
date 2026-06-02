import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockArticle, MouvementStock, StockDashboard, LotStockResponse } from '../../models/stock.model';

type ActiveTab = 'dashboard' | 'stock' | 'historique' | 'ajustement';

export interface InventaireLine {
  article: StockArticle;
  stockReel: number | null;
  notes: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit {

  // ── Onglet actif ──────────────────────────────────────────────────────
  private _activeTab: ActiveTab = 'dashboard';
  get activeTab(): ActiveTab { return this._activeTab; }
  set activeTab(val: ActiveTab) {
    this._activeTab = val;
    if (val === 'dashboard')  this.loadDashboard();
    if (val === 'stock')      this.loadStockArticles();
    if (val === 'historique') this.loadMouvements();
    if (val === 'ajustement') {
      if (!this.articles.length) { this.loadStockArticles(); }
      else { this.buildInventaireLines(); }
    }
  }

  // ── Dashboard ─────────────────────────────────────────────────────────
  dashboard: StockDashboard | null = null;
  dashboardLoading = false;

  // ── Stock par article ─────────────────────────────────────────────────
  articles: StockArticle[] = [];
  filteredArticles: StockArticle[] = [];
  articlesLoading = false;
  searchTerm = '';
  filterAlerte: 'tous' | 'alerte' | 'rupture' | 'ok' = 'tous';

  editingSeuilId: number | null = null;
  editingSeuilValue = 0;
  seuilSaving = false;
  seuilError = '';

  // ── Lots par article ──────────────────────────────────────────────────
  lotsMap: Map<number, LotStockResponse[]> = new Map();
  tauxMoyenMap: Map<number, number>        = new Map();
  expandedLotsId: number | null            = null;
  lotsLoading = false;

  // ── Historique ────────────────────────────────────────────────────────
  mouvements: MouvementStock[] = [];
  filteredMouvements: MouvementStock[] = [];
  mouvementsLoading = false;
  searchMvt = '';
  filterTypeMvt = '';

  // ── Ajustement / Inventaire ───────────────────────────────────────────
  ajustementForm!: FormGroup;
  ajustementSaving = false;
  ajustementSuccess = '';
  ajustementError   = '';
  ajustArticleSearch = '';
  ajustArticleSuggestions: StockArticle[] = [];
  showAjustSuggestions = false;

  inventaireLines: InventaireLine[] = [];
  inventaireSearch = '';
  inventaireSavingAll = false;

  errorMessage = '';

  constructor(
    private stockService: StockService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildAjustementForm();
    this.loadDashboard();
  }

  // ── Dashboard ─────────────────────────────────────────────────────────
  loadDashboard(): void {
    this.dashboardLoading = true;
    this.stockService.getDashboard().subscribe({
      next: d  => { this.dashboard = d; this.dashboardLoading = false; },
      error: () => { this.dashboardLoading = false; }
    });
  }

  // ── Stock articles ────────────────────────────────────────────────────
  loadStockArticles(): void {
    this.articlesLoading = true;
    this.stockService.getStockArticles().subscribe({
      next: list => {
        this.articles = list ?? [];
        this.applyArticleFilter();
        this.articlesLoading = false;
        if (this._activeTab === 'ajustement') this.buildInventaireLines();
      },
      error: () => { this.articlesLoading = false; }
    });
  }

  applyArticleFilter(): void {
    let list = [...this.articles];
    if (this.filterAlerte === 'alerte')  list = list.filter(a => a.enAlerte);
    if (this.filterAlerte === 'rupture') list = list.filter(a => a.enRupture);
    if (this.filterAlerte === 'ok')      list = list.filter(a => !a.enAlerte && !a.enRupture);
    const term = this.searchTerm.trim().toLowerCase();
    if (term) list = list.filter(a =>
      a.codeArticle.toLowerCase().includes(term) ||
      a.designation.toLowerCase().includes(term) ||
      a.famille.toLowerCase().includes(term)
    );
    this.filteredArticles = list;
  }

  get valeurTotaleFiltre(): number {
    return this.filteredArticles.reduce((s, a) => s + (a.valeurStock ?? 0), 0);
  }

  // ── Seuil minimum ─────────────────────────────────────────────────────
  startEditSeuil(a: StockArticle): void {
    this.editingSeuilId    = a.id;
    this.editingSeuilValue = +(a.stockMinimum ?? 0);
    this.seuilError        = '';
  }

  onSeuilChange(raw: unknown): void {
    const parsed = parseFloat(String(raw));
    this.editingSeuilValue = isNaN(parsed) ? 0 : parsed;
  }

  saveSeuil(a: StockArticle): void {
    const val = +this.editingSeuilValue;
    if (isNaN(val) || val < 0) {
      this.seuilError = 'Valeur invalide (doit être ≥ 0).';
      return;
    }
    this.seuilSaving = true;
    this.seuilError  = '';
    this.stockService.updateSeuilMinimum(a.id, val).subscribe({
      next: () => {
        a.stockMinimum      = val;
        a.enAlerte          = a.stock > 0 && a.stock <= val;
        this.editingSeuilId = null;
        this.seuilSaving    = false;
        this.applyArticleFilter();
      },
      error: (err) => {
        this.seuilSaving = false;
        this.seuilError  = err?.error?.message || 'Erreur lors de la mise à jour du seuil.';
      }
    });
  }

  cancelEditSeuil(): void {
    this.editingSeuilId = null;
    this.seuilError     = '';
  }

  // ── Lots ──────────────────────────────────────────────────────────────
  toggleLots(a: StockArticle): void {
    if (this.expandedLotsId === a.id) {
      this.expandedLotsId = null;
      return;
    }
    this.expandedLotsId = a.id;
    if (this.lotsMap.has(a.id)) return;
    this.lotsLoading = true;
    this.stockService.getLotsArticle(a.id).subscribe({
      next: lots => {
        this.lotsMap.set(a.id, lots);
        this.lotsLoading = false;
      },
      error: () => { this.lotsLoading = false; }
    });
    if (!this.tauxMoyenMap.has(a.id)) {
      this.stockService.getTauxMoyen(a.id).subscribe({
        next: t => this.tauxMoyenMap.set(a.id, t)
      });
    }
  }

  getLots(id: number): LotStockResponse[] {
    return this.lotsMap.get(id) ?? [];
  }

  getTauxMoyen(id: number): string {
    const t = this.tauxMoyenMap.get(id);
    return t != null ? (t * 100).toFixed(2) + '%' : '—';
  }

  statutStockLabel(a: StockArticle): string {
    const d = a.disponibleReel ?? 0;
    if (d <= 0) return 'Rupture';
    if (a.enAlerte) return 'Alerte';
    return 'OK';
  }

  statutStockClass(a: StockArticle): string {
    const d = a.disponibleReel ?? 0;
    if (d <= 0) return 'statut-rupture';
    if (a.enAlerte) return 'statut-alerte';
    return 'statut-ok';
  }

  // ── Mouvements ────────────────────────────────────────────────────────
  loadMouvements(): void {
    this.mouvementsLoading = true;
    this.stockService.getMouvements().subscribe({
      next: list => {
        this.mouvements = list ?? [];
        this.applyMvtFilter();
        this.mouvementsLoading = false;
      },
      error: () => { this.mouvementsLoading = false; }
    });
  }

  applyMvtFilter(): void {
    let list = [...this.mouvements];
    if (this.filterTypeMvt) list = list.filter(m => m.typeMouvement === this.filterTypeMvt);
    const term = this.searchMvt.trim().toLowerCase();
    if (term) list = list.filter(m =>
      m.codeArticle?.toLowerCase().includes(term) ||
      m.designation?.toLowerCase().includes(term) ||
      m.referenceDocument?.toLowerCase().includes(term)
    );
    this.filteredMouvements = list;
  }

  // ── Ajustement ────────────────────────────────────────────────────────
  private buildAjustementForm(): void {
    this.ajustementForm = this.fb.group({
      articleId:         [null as number | null],
      quantite:          [null],
      notes:             [''],
      referenceDocument: ['']
    });
  }

  // ── Inventaire physique ───────────────────────────────────────────────

  buildInventaireLines(): void {
    this.inventaireLines = this.articles.map(a => ({
      article: a,
      stockReel: null,
      notes: '',
      saving: false,
      saved: false,
      error: ''
    }));
  }

  get inventaireLinesFiltrees(): InventaireLine[] {
    const term = this.inventaireSearch.trim().toLowerCase();
    if (!term) return this.inventaireLines;
    return this.inventaireLines.filter(l =>
      l.article.codeArticle.toLowerCase().includes(term) ||
      l.article.designation.toLowerCase().includes(term) ||
      (l.article.famille ?? '').toLowerCase().includes(term)
    );
  }

  getDiff(line: InventaireLine): number | null {
    if (line.stockReel === null || line.stockReel === undefined) return null;
    return +(+line.stockReel - line.article.stock).toFixed(3);
  }

  get nbLignesAajuster(): number {
    return this.inventaireLines.filter(l => {
      const d = this.getDiff(l); return d !== null && d !== 0;
    }).length;
  }

  get nbLignesSaisies(): number {
    return this.inventaireLines.filter(l => l.stockReel !== null).length;
  }

  get nbLignesValidees(): number {
    return this.inventaireLines.filter(l => l.saved).length;
  }

  ajusterLigne(line: InventaireLine): void {
    const diff = this.getDiff(line);
    if (diff === null || diff === 0) return;
    line.saving = true;
    line.error  = '';
    this.stockService.creerAjustement({
      articleId: line.article.id,
      quantite:  diff,
      notes: line.notes || `Inventaire physique — Stock réel saisi : ${line.stockReel}`,
    }).subscribe({
      next: mvt => {
        line.saving = false;
        line.saved  = true;
        line.article.stock = +(mvt.stockApres ?? line.stockReel!);
        line.stockReel = null;
        setTimeout(() => { line.saved = false; }, 3000);
        this.loadDashboard();
      },
      error: err => {
        line.saving = false;
        line.error  = err?.error?.message || 'Erreur';
      }
    });
  }

  ajusterTout(): void {
    const lines = this.inventaireLinesFiltrees.filter(l => {
      const d = this.getDiff(l); return d !== null && d !== 0;
    });
    if (!lines.length) return;
    lines.forEach(l => this.ajusterLigne(l));
  }

  resetInventaire(): void {
    this.inventaireLines.forEach(l => { l.stockReel = null; l.notes = ''; l.error = ''; });
    this.inventaireSearch = '';
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  typeMvtLabel(type: string): string {
    const labels: Record<string, string> = {
      ENTREE_ACHAT:       'Entrée Achat',
      SORTIE_VENTE:       'Sortie Vente',
      SORTIE_DERIVE:      'Sortie Dérivé',
      AJUSTEMENT_POSITIF: 'Ajustement +',
      AJUSTEMENT_NEGATIF: 'Ajustement −',
      INVENTAIRE:         'Inventaire'
    };
    return labels[type] ?? type;
  }

  typeMvtClass(type: string): string {
    if (type === 'ENTREE_ACHAT' || type === 'AJUSTEMENT_POSITIF') return 'chip chip-entree';
    if (type === 'SORTIE_VENTE' || type === 'AJUSTEMENT_NEGATIF') return 'chip chip-sortie';
    if (type === 'SORTIE_DERIVE') return 'chip chip-derive';
    return 'chip chip-neutre';
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })
         + ' ' + d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  }

  formatNum(val: number | null | undefined, dec = 3): string {
    if (val == null) return '—';
    return val.toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  get familleMaxValeur(): number {
    if (!this.dashboard?.parFamille?.length) return 1;
    return Math.max(...this.dashboard.parFamille.map(f => f.valeur), 1);
  }

  barWidth(valeur: number): number {
    return Math.round((valeur / this.familleMaxValeur) * 100);
  }
}
