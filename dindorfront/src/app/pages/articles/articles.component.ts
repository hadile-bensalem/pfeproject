import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Article, UNITES_ARTICLE } from '../../models/article.model';
import { ArticleService } from '../../services/article.service';
import { FamilleService } from '../../services/famille.service';
import { OrigineService } from '../../services/origine.service';
import { Famille } from '../../models/famille.model';
import { Origine } from '../../models/origine.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyFormatPipe, NumberFormatPipe],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  sortColumn: keyof Article | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isModalArticleOpen = false;
  isEditingArticle = false;
  articleForm!: FormGroup;
  articleDuplicateError = '';
  articlesAddedInModal: Article[] = [];

  // Prix calculés (affichage)
  prixRevient = 0;
  isSavingInit = false;
  initSuccessMsg = '';

  // Preview NOUVELLE STOCK (flux deux étapes)
  showInitPreview = false;
  nouvelleStockPreview = 0;

  unites = [...UNITES_ARTICLE];
  familles: Famille[] = [];
  origines: Origine[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private articleService: ArticleService,
    private familleService: FamilleService,
    private origineService: OrigineService
  ) {
    this.buildArticleForm();
  }

  private buildArticleForm(): void {
    this.articleForm = this.fb.group({
      id: [0],
      codeArticle:      ['', [Validators.required, Validators.maxLength(50)]],
      designation:      ['', [Validators.required, Validators.maxLength(500)]],
      unite:            ['', Validators.required],
      famille:          ['', Validators.required],
      origine:          [''],
      typeArticle:      ['standard', Validators.required],
      codeArticleSource:[''],
      produitSpecial:   [false],
      qteNbre:          [false],
      autreIndir:       [false],
      stockezBlock:     [false],
      // Champs prix
      prixAchatHT:      [0],
      tauxConversion:   [0],
      tva:              [0],
      margeB:           [0],
      prixVente:        [0],
      prixPublic:       [0],
      // Initialisation stock
      qteInitiale:      [0],
    });

    // Recalcul automatique quand PUA ou taux changent
    this.articleForm.get('prixAchatHT')?.valueChanges.subscribe(() => this.onPuaOuTauxChange());
    this.articleForm.get('tauxConversion')?.valueChanges.subscribe(() => this.onPuaOuTauxChange());
    // Recalcul prix vente quand marge change
    this.articleForm.get('margeB')?.valueChanges.subscribe(() => this.onMargeBChange());
    // Recalcul marge quand prix vente change manuellement
    this.articleForm.get('prixVente')?.valueChanges.subscribe(() => this.onPrixVenteChange());
  }

  // ── Calculs automatiques ──────────────────────────────────────────────

  private _recalculating = false;

  private onPuaOuTauxChange(): void {
    if (this._recalculating) return;
    this._recalculating = true;
    const pua  = +(this.articleForm.get('prixAchatHT')?.value  || 0);
    const taux = +(this.articleForm.get('tauxConversion')?.value || 0);
    // PU.REV = PUA / (taux/100) si taux > 0 et < 100, sinon PUA
    if (taux > 0 && taux < 100) {
      this.prixRevient = +(pua / (taux / 100)).toFixed(3);
    } else {
      this.prixRevient = +pua.toFixed(3);
    }
    // Recalcul prix vente
    const marge = +(this.articleForm.get('margeB')?.value || 0);
    const pv = +(this.prixRevient * (1 + marge / 100)).toFixed(3);
    this.articleForm.get('prixVente')?.setValue(pv, { emitEvent: false });
    this._recalculating = false;
  }

  private onMargeBChange(): void {
    if (this._recalculating) return;
    this._recalculating = true;
    const marge = +(this.articleForm.get('margeB')?.value || 0);
    const pv    = +(this.prixRevient * (1 + marge / 100)).toFixed(3);
    this.articleForm.get('prixVente')?.setValue(pv, { emitEvent: false });
    this._recalculating = false;
  }

  private onPrixVenteChange(): void {
    if (this._recalculating) return;
    this._recalculating = true;
    const pv = +(this.articleForm.get('prixVente')?.value || 0);
    if (this.prixRevient > 0) {
      const marge = +((pv / this.prixRevient - 1) * 100).toFixed(2);
      this.articleForm.get('margeB')?.setValue(marge, { emitEvent: false });
    }
    this._recalculating = false;
  }

  // ── Données affichées dans le tableau ────────────────────────────────

  get articlesOriginePossible(): Article[] {
    return this.articles.filter(
      a => !a.codeArticleSource && (!!a.produitSpecial || this.aUnDeriveEnregistre(a.codeArticle))
    );
  }

  private aUnDeriveEnregistre(codeArticle: string): boolean {
    return this.articles.some(x => x.codeArticleSource === codeArticle);
  }

  libelleTypeArticle(a: Article): string {
    if (a.codeArticleSource) return 'Transformé';
    if (a.produitSpecial)    return 'Spécial';
    return '—';
  }

  aDejaPrixAchat(a: Article): boolean {
    return (a.prixAchatHT != null && a.prixAchatHT > 0) || (a.pump != null && a.pump > 0);
  }

  effectivePrixAchat(a: Article): number {
    if (a.codeArticleSource) return a.pump ?? 0;
    return (a.prixAchatHT && a.prixAchatHT > 0) ? a.prixAchatHT : (a.pump ?? 0);
  }

  // ── Init ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadArticles();
    this.loadFamillesEtOrigines();
  }

  private loadFamillesEtOrigines(): void {
    this.familleService.getAll().subscribe(f => (this.familles = f ?? []));
    this.origineService.getAll().subscribe(o => (this.origines = o ?? []));
  }

  private loadArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.articleService.getAll().subscribe({
      next: (data) => {
        this.articles = data ?? [];
        this.syncArticleCodeCounter();
        this.applyFilterAndSort();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des articles.';
        this.isLoading = false;
      }
    });
  }

  private applyFilterAndSort(): void {
    let list = [...this.articles];
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(a =>
        a.codeArticle.toLowerCase().includes(term) ||
        a.designation.toLowerCase().includes(term) ||
        a.famille.toLowerCase().includes(term)
      );
    }
    if (this.sortColumn) {
      list.sort((a, b) => {
        const va = a[this.sortColumn as keyof Article];
        const vb = b[this.sortColumn as keyof Article];
        let cmp = 0;
        if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
        else if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb);
        else cmp = String(va ?? '').localeCompare(String(vb ?? ''));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    this.filteredArticles = list;
  }

  get totalValeur(): number {
    return this.filteredArticles.reduce((s, a) => s + this.valeurArticle(a), 0);
  }

  valeurArticle(a: Article): number {
    const qty  = a.stock1 ?? 0;
    const prix = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
    return qty * prix;
  }

  onSearchChange(): void { this.applyFilterAndSort(); }

  sortBy(column: keyof Article): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  // ── Code article auto ─────────────────────────────────────────────────

  private readonly ARTICLE_CODE_KEY = 'dindor_article_code';

  private generateCodeArticle(): string {
    let n = 1;
    try {
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      if (stored) n = parseInt(stored, 10) + 1;
    } catch {}
    localStorage.setItem(this.ARTICLE_CODE_KEY, n.toString());
    return n.toString();
  }

  private syncArticleCodeCounter(): void {
    let maxCode = 0;
    this.articles.forEach(a => {
      const n = parseInt(String(a.codeArticle || ''), 10);
      if (!isNaN(n) && n > maxCode) maxCode = n;
    });
    try {
      const stored  = localStorage.getItem(this.ARTICLE_CODE_KEY);
      const current = stored ? parseInt(stored, 10) : 0;
      if (maxCode >= current) localStorage.setItem(this.ARTICLE_CODE_KEY, maxCode.toString());
    } catch {}
  }

  getNextCodeArticle(): string {
    let n = 0;
    try {
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      if (stored) n = parseInt(stored, 10);
    } catch {}
    return (n + 1).toString();
  }

  // ── Modal ouvrir / fermer ─────────────────────────────────────────────

  openAddArticleModal(): void {
    this.isEditingArticle = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
    this.prixRevient = 0;
    this.initSuccessMsg = '';
    this.articleForm.reset({
      id: 0, codeArticle: this.getNextCodeArticle(), designation: '',
      unite: '', famille: '', origine: '', typeArticle: 'standard',
      codeArticleSource: '', produitSpecial: false, qteNbre: false,
      autreIndir: false, stockezBlock: false,
      prixAchatHT: 0, tauxConversion: 0, tva: 0, margeB: 0,
      prixVente: 0, prixPublic: 0, qteInitiale: 0
    });
    this.isModalArticleOpen = true;
  }

  closeArticleModal(): void {
    this.isModalArticleOpen = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
    this.initSuccessMsg = '';
    this.showInitPreview = false;
    this.nouvelleStockPreview = 0;
  }

  onViderArticle(): void {
    this.prixRevient = 0;
    this.initSuccessMsg = '';
    this.showInitPreview = false;
    this.nouvelleStockPreview = 0;
    this.articleForm.patchValue({
      designation: '', unite: '', famille: '', origine: '',
      typeArticle: 'standard', codeArticleSource: '', produitSpecial: false,
      qteNbre: false, autreIndir: false, stockezBlock: false,
      prixAchatHT: 0, tauxConversion: 0, tva: 0, margeB: 0,
      prixVente: 0, prixPublic: 0, qteInitiale: 0
    });
    if (!this.isEditingArticle) {
      this.articleForm.patchValue({ codeArticle: this.getNextCodeArticle() });
    }
    this.articleDuplicateError = '';
  }

  // ── Enregistrement ───────────────────────────────────────────────────

  onAjouterArticle(): void {
    if (this.articleForm.invalid) { this.articleForm.markAllAsTouched(); return; }
    const v    = this.articleForm.value;
    const type = v.typeArticle as 'standard' | 'special' | 'derive';
    if (type === 'derive' && !v.codeArticleSource) {
      this.articleDuplicateError = 'Choisissez l\'article d\'origine pour un produit transformé.';
      return;
    }
    this.articleDuplicateError = '';
    this.articleService.checkDuplicate(v.codeArticle, v.designation, this.isEditingArticle ? v.id : undefined).subscribe({
      next: (r: { codeExists: boolean; designationExists: boolean }) => {
        if (r.codeExists) { this.articleDuplicateError = 'Un article avec ce code existe déjà.'; return; }
        if (r.designationExists) { this.articleDuplicateError = 'Un article avec cette désignation existe déjà.'; return; }
        this.saveArticle();
      }
    });
  }

  private saveArticle(): void {
    const v    = this.articleForm.value;
    const type = v.typeArticle as 'standard' | 'special' | 'derive';
    const codeFinal = this.isEditingArticle ? v.codeArticle : this.generateCodeArticle();
    const ex        = this.isEditingArticle ? this.articles.find(x => x.id === v.id) : undefined;

    const payload: Partial<Article> = {
      codeArticle:       codeFinal,
      designation:       v.designation,
      unite:             v.unite,
      famille:           v.famille != null ? String(v.famille) : '',
      origine:           v.origine != null ? String(v.origine) : '',
      produitSpecial:    type === 'special',
      codeArticleSource: type === 'derive' && v.codeArticleSource ? String(v.codeArticleSource).trim() : null,
      qteNbre:           !!v.qteNbre,
      autreIndir:        !!v.autreIndir,
      stockezBlock:      !!v.stockezBlock,
      prixAchatHT:       +(v.prixAchatHT || 0),
      tauxConversion:    +(v.tauxConversion || 0),
      tva:               +(v.tva || 0),
      prixVente:         +(v.prixVente || 0),
      prixPublic:        +(v.prixPublic || 0),
      stock1:            ex?.stock1 ?? 0,
      stock2:            ex?.stock2 ?? 0,
      pump:              ex?.pump   ?? 0
    };

    if (this.isEditingArticle && v.id) {
      this.articleService.update(v.id, payload).subscribe({
        next: (updated: Article) => {
          const idx = this.articles.findIndex(a => a.id === updated.id);
          if (idx !== -1) this.articles[idx] = updated;
          this.applyFilterAndSort();
          this.closeArticleModal();
        },
        error: (err: { error?: { message?: string }; status?: number }) =>
          this.errorMessage = err?.error?.message || 'Erreur mise à jour.'
      });
    } else {
      this.articleService.create(payload).subscribe({
        next: (created: Article) => {
          this.articles = [created, ...this.articles];
          this.applyFilterAndSort();
          this.articlesAddedInModal = [created, ...this.articlesAddedInModal];
          this.onViderArticle();
        },
        error: (err: { error?: { message?: string }; status?: number }) =>
          this.errorMessage = err?.error?.message || 'Erreur création.'
      });
    }
  }

  openEditArticle(article: Article): void {
    this.isEditingArticle    = true;
    this.articleDuplicateError = '';
    this.initSuccessMsg      = '';
    const familleVal = this.familles.find(f => f.code === Number(article.famille) || f.nom === article.famille)?.code ?? article.famille;
    const origineVal = this.origines.find(o => o.code === Number(article.origine) || o.designation === article.origine)?.code ?? article.origine;
    let typeArticle: 'standard' | 'special' | 'derive' = 'standard';
    if (article.codeArticleSource) typeArticle = 'derive';
    else if (article.produitSpecial) typeArticle = 'special';

    const pua  = +(article.prixAchatHT || 0);
    const taux = +(article.tauxConversion || 0);
    if (taux > 0 && taux < 100) {
      this.prixRevient = +(pua / (taux / 100)).toFixed(3);
    } else {
      this.prixRevient = pua;
    }

    this.articleForm.patchValue({
      id: article.id, codeArticle: article.codeArticle, designation: article.designation,
      unite: article.unite, famille: familleVal, origine: origineVal, typeArticle,
      codeArticleSource: article.codeArticleSource || '',
      produitSpecial: !!article.produitSpecial,
      qteNbre: article.qteNbre ?? false, autreIndir: article.autreIndir ?? false,
      stockezBlock: article.stockezBlock ?? false,
      prixAchatHT: pua, tauxConversion: taux,
      tva: +(article.tva || 0),
      margeB: (article.prixVente && this.prixRevient > 0)
        ? +((+(article.prixVente) / this.prixRevient - 1) * 100).toFixed(2) : 0,
      prixVente:  +(article.prixVente  || 0),
      prixPublic: +(article.prixPublic || 0),
      qteInitiale: 0
    });
    this.isModalArticleOpen = true;
  }

  deleteArticle(article: Article, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Supprimer l'article ${article.designation} ?`)) return;
    this.articleService.delete(article.id).subscribe({
      next: () => {
        this.articles = this.articles.filter(a => a.id !== article.id);
        this.applyFilterAndSort();
      },
      error: (err: { error?: { message?: string; error?: string }; message?: string; status?: number }) => {
        const msg = err?.error?.message ?? err?.error?.error ?? err?.message;
        this.errorMessage = (typeof msg === 'string' && msg) ? msg : 'Erreur suppression.';
      }
    });
  }

  // ── INITIALISER STOCK ────────────────────────────────────────────────

  get articleCourant(): Article | undefined {
    const id = this.articleForm.get('id')?.value;
    return id ? this.articles.find(a => a.id === id) : undefined;
  }

  // Étape 1 : montrer le panneau de confirmation "NOUVELLE STOCK"
  preparerInitialisation(): void {
    const articleId = this.articleForm.get('id')?.value;
    const qteInit   = +(this.articleForm.get('qteInitiale')?.value || 0);

    if (!articleId) {
      this.articleDuplicateError = 'Enregistrez d\'abord l\'article avant d\'initialiser le stock.';
      return;
    }
    if (qteInit < 0) {
      this.articleDuplicateError = 'La quantité doit être positive ou nulle.';
      return;
    }
    this.articleDuplicateError = '';
    this.initSuccessMsg = '';
    this.nouvelleStockPreview = qteInit;
    this.showInitPreview = true;
  }

  annulerInitialisation(): void {
    this.showInitPreview = false;
  }

  // Étape 2 : valider → appel API, création du mouvement INVENTAIRE
  validerInitialisation(): void {
    const articleId = this.articleForm.get('id')?.value;
    const qteInit   = this.nouvelleStockPreview;
    const pua       = +(this.articleForm.get('prixAchatHT')?.value || 0);

    this.showInitPreview = false;
    this.isSavingInit = true;
    this.initSuccessMsg = '';

    this.articleService.initialiserStock({ articleId, quantite: qteInit, prixUnitaire: pua > 0 ? pua : undefined }).subscribe({
      next: () => {
        this.isSavingInit = false;
        this.initSuccessMsg = `Stock initialisé : ${qteInit} ${this.articleForm.get('unite')?.value}`;
        this.loadArticles();
      },
      error: (err: { error?: { message?: string }; status?: number }) => {
        this.isSavingInit = false;
        this.articleDuplicateError = err?.error?.message || 'Erreur initialisation stock.';
      }
    });
  }

  voirMouvements(): void {
    this.closeArticleModal();
    this.router.navigate(['/inventaire']);
  }

  // ── Navigation ────────────────────────────────────────────────────────

  navigateToInventaire(): void { this.router.navigate(['/inventaire']); }

  quitter(): void { this.router.navigate(['/home']); }

  initialiser(): void {
    this.searchTerm    = '';
    this.sortColumn    = '';
    this.sortDirection = 'asc';
    this.loadArticles();
  }
}
