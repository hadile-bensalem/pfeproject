import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';

interface StockArticle {
  id: number;
  codeArticle: string;
  designation: string;
  unite: string;
  stock: number;       // MAGASIN1
  stock2?: number;     // NOIR
  stockTotal: number;  // QTE T.
  pump: number;
  famille: string;
  estDerive: boolean;
}

interface Mouvement {
  id: number;
  typeMouvement: string;
  quantite: number;
  prixUnitaire: number;
  stockAvant: number;
  stockApres: number;
  referenceDocument: string;
  notes: string;
  dateOperation: string;
}

@Component({
  selector: 'app-inventaire',
  standalone: true,
  imports: [CommonModule, FormsModule, NumberFormatPipe],
  templateUrl: './inventaire.component.html',
  styleUrl: './inventaire.component.css'
})
export class InventaireComponent implements OnInit {

  articles: StockArticle[] = [];
  filteredArticles: StockArticle[] = [];
  isLoadingArticles = false;

  selectedArticle: StockArticle | null = null;
  mouvements: Mouvement[] = [];
  isLoadingMvt = false;

  searchTerm = '';
  filterType: 'tous' | 'source' | 'derive' = 'tous';

  constructor(
    private articleService: ArticleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoadingArticles = true;
    this.articleService.getStockArticles().subscribe({
      next: (data: any[]) => {
        this.articles = data.map(a => ({
          id:          a.id,
          codeArticle: a.codeArticle,
          designation: a.designation,
          unite:       a.unite ?? '',
          stock:       +(a.stock ?? 0),
          stock2:      +(a.stockReserve ?? 0),
          stockTotal:  +(a.stock ?? 0) + +(a.stockReserve ?? 0),
          pump:        +(a.pump ?? 0),
          famille:     a.famille ?? '—',
          estDerive:   !!a.estDerive
        }));
        this.applyFilter();
        this.isLoadingArticles = false;
      },
      error: () => { this.isLoadingArticles = false; }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredArticles = this.articles.filter(a => {
      const matchSearch = !term
        || a.designation.toLowerCase().includes(term)
        || a.codeArticle.toLowerCase().includes(term);
      const matchType =
        this.filterType === 'tous'    ? true :
        this.filterType === 'source'  ? !a.estDerive :
        a.estDerive;
      return matchSearch && matchType;
    });
  }

  selectArticle(a: StockArticle): void {
    if (this.selectedArticle?.id === a.id) {
      this.selectedArticle = null;
      this.mouvements = [];
      return;
    }
    this.selectedArticle = a;
    this.loadMouvements(a.id);
  }

  loadMouvements(articleId: number): void {
    this.isLoadingMvt = true;
    this.articleService.getMouvementsByArticle(articleId).subscribe({
      next: (data: any[]) => {
        this.mouvements = data.map(m => ({
          id:                 m.id,
          typeMouvement:      m.typeMouvement,
          quantite:           +(m.quantite ?? 0),
          prixUnitaire:       +(m.prixUnitaire ?? 0),
          stockAvant:         +(m.stockAvant ?? 0),
          stockApres:         +(m.stockApres ?? 0),
          referenceDocument:  m.referenceDocument ?? '',
          notes:              m.notes ?? '',
          dateOperation:      m.dateOperation ?? ''
        }));
        this.isLoadingMvt = false;
      },
      error: () => { this.isLoadingMvt = false; }
    });
  }

  libelleMvt(type: string): string {
    const map: Record<string, string> = {
      'INVENTAIRE':          'INV',
      'ENTREE_ACHAT':        'EFA',
      'SORTIE_VENTE':        'SFC',
      'SORTIE_DERIVE':       'TAF',
      'AJUSTEMENT_POSITIF':  'AJ+',
      'AJUSTEMENT_NEGATIF':  'AJ-',
    };
    return map[type] ?? type;
  }

  classMvt(type: string): string {
    if (type === 'INVENTAIRE')         return 'mvt-inv';
    if (type === 'ENTREE_ACHAT')       return 'mvt-entree';
    if (type.startsWith('SORTIE'))     return 'mvt-sortie';
    if (type === 'AJUSTEMENT_POSITIF') return 'mvt-aj-pos';
    if (type === 'AJUSTEMENT_NEGATIF') return 'mvt-aj-neg';
    return '';
  }

  estEntree(m: Mouvement): boolean {
    return m.quantite > 0;
  }

  formatDate(d: string): string {
    if (!d) return '';
    return d.substring(0, 10);
  }

  get totalEntrees(): number {
    return this.mouvements
      .filter(m => m.quantite > 0)
      .reduce((s, m) => s + m.quantite, 0);
  }

  get totalSorties(): number {
    return this.mouvements
      .filter(m => m.quantite < 0)
      .reduce((s, m) => s + m.quantite * -1, 0);
  }

  retourArticles(): void {
    this.router.navigate(['/articles']);
  }
}
