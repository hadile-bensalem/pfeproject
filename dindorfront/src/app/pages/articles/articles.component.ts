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
      codeArticle: ['', [Validators.required, Validators.maxLength(50)]],
      designation: ['', [Validators.required, Validators.maxLength(500)]],
      unite: ['', Validators.required],
      famille: ['', Validators.required],
      origine: ['', Validators.maxLength(200)],
      prixAchatHT: [0, Validators.min(0)],
      prixVente: [0, Validators.min(0)],
      tva: [0, [Validators.min(0), Validators.max(100)]],
      stock1: [0, Validators.min(0)],
      stock2: [0, Validators.min(0)],
      pump: [0, Validators.min(0)],
      qteNbre: [false],
      autreIndir: [false],
      stockezBlock: [false]
    });
  }

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
        else if (typeof va === 'boolean' && typeof vb === 'boolean') cmp = (va ? 1 : 0) - (vb ? 1 : 0);
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
    const qty = a.stock1 ?? 0;
    const prix = (a.pump && a.pump > 0) ? a.pump : (a.prixAchatHT ?? 0);
    return qty * prix;
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  sortBy(column: keyof Article): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

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
      const stored = localStorage.getItem(this.ARTICLE_CODE_KEY);
      const current = stored ? parseInt(stored, 10) : 0;
      if (maxCode >= current) {
        localStorage.setItem(this.ARTICLE_CODE_KEY, maxCode.toString());
      }
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

  openAddArticleModal(): void {
    this.isEditingArticle = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
    this.articleForm.reset({
      id: 0,
      codeArticle: this.getNextCodeArticle(),
      designation: '',
      unite: '',
      famille: '',
      origine: '',
      prixAchatHT: 0,
      prixVente: 0,
      tva: 0,
      stock1: 0,
      stock2: 0,
      pump: 0,
      qteNbre: false,
      autreIndir: false,
      stockezBlock: false
    });
    this.isModalArticleOpen = true;
  }

  closeArticleModal(): void {
    this.isModalArticleOpen = false;
    this.articleDuplicateError = '';
    this.articlesAddedInModal = [];
  }

  onViderArticle(): void {
    this.articleForm.patchValue({
      designation: '',
      unite: '',
      famille: '',
      origine: '',
      prixAchatHT: 0,
      prixVente: 0,
      tva: 0,
      stock1: 0,
      stock2: 0,
      pump: 0,
      qteNbre: false,
      autreIndir: false,
      stockezBlock: false
    });
    if (!this.isEditingArticle) {
      this.articleForm.patchValue({ codeArticle: this.getNextCodeArticle() });
    }
    this.articleDuplicateError = '';
  }

  onAjouterArticle(): void {
    if (this.articleForm.invalid) {
      this.articleForm.markAllAsTouched();
      return;
    }
    const v = this.articleForm.value;
    this.articleDuplicateError = '';
    this.articleService.checkDuplicate(v.codeArticle, v.designation, this.isEditingArticle ? v.id : undefined).subscribe({
      next: (r) => {
        if (r.codeExists) {
          this.articleDuplicateError = 'Un article avec ce code existe déjà.';
          return;
        }
        if (r.designationExists) {
          this.articleDuplicateError = 'Un article avec cette désignation existe déjà.';
          return;
        }
        this.saveArticle();
      }
    });
  }

  private saveArticle(): void {
    const v = this.articleForm.value;
    const codeFinal = this.isEditingArticle ? v.codeArticle : this.generateCodeArticle();
    const payload: Partial<Article> = {
      codeArticle: codeFinal,
      designation: v.designation,
      unite: v.unite,
      famille: v.famille != null ? String(v.famille) : '',
      origine: v.origine != null ? String(v.origine) : '',
      prixAchatHT: Number(v.prixAchatHT) || 0,
      prixVente: Number(v.prixVente) || 0,
      tva: Number(v.tva) || 0,
      stock1: Number(v.stock1) || 0,
      stock2: Number(v.stock2) || 0,
      pump: Number(v.pump) || 0,
      qteNbre: !!v.qteNbre,
      autreIndir: !!v.autreIndir,
      stockezBlock: !!v.stockezBlock
    };
    if (this.isEditingArticle && v.id) {
      this.articleService.update(v.id, payload).subscribe({
        next: (updated) => {
          const idx = this.articles.findIndex(a => a.id === updated.id);
          if (idx !== -1) this.articles[idx] = updated;
          this.applyFilterAndSort();
          this.closeArticleModal();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.'
      });
    } else {
      this.articleService.create(payload).subscribe({
        next: (created) => {
          this.articles = [created, ...this.articles];
          this.applyFilterAndSort();
          this.articlesAddedInModal = [created, ...this.articlesAddedInModal];
          this.onViderArticle();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la création.'
      });
    }
  }

  openEditArticle(article: Article): void {
    this.isEditingArticle = true;
    this.articleDuplicateError = '';
    const familleVal = this.familles.find(f => f.code === Number(article.famille) || f.nom === article.famille)?.code ?? article.famille;
    const origineVal = this.origines.find(o => o.code === Number(article.origine) || o.designation === article.origine)?.code ?? article.origine;
    this.articleForm.patchValue({
      id: article.id,
      codeArticle: article.codeArticle,
      designation: article.designation,
      unite: article.unite,
      famille: familleVal,
      origine: origineVal,
      prixAchatHT: article.prixAchatHT,
      prixVente: article.prixVente,
      tva: article.tva ?? 0,
      stock1: article.stock1,
      stock2: article.stock2 ?? 0,
      pump: article.pump ?? 0,
      qteNbre: article.qteNbre ?? false,
      autreIndir: article.autreIndir ?? false,
      stockezBlock: article.stockezBlock ?? false
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
      error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la suppression.'
    });
  }

  quitter(): void {
    this.router.navigate(['/home']);
  }

  initialiser(): void {
    this.searchTerm = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.loadArticles();
  }
}
