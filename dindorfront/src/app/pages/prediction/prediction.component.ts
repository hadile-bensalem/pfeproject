import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PredictionService, ArticleSummary, ArticleDashboardItem,
  PredictionResult, PredictionPoint, ForecastPoint
} from '../../services/prediction.service';

declare const Chart: any;

@Component({
  selector: 'app-prediction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prediction.component.html',
  styleUrl: './prediction.component.css'
})
export class PredictionComponent implements OnInit, OnDestroy {

  @ViewChild('priceChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private predictionService = inject(PredictionService);

  // ── Tab state ──────────────────────────────────────────────────────────
  activeTab: 'dashboard' | 'detail' = 'dashboard';

  // ── Dashboard ──────────────────────────────────────────────────────────
  dashboardItems: ArticleDashboardItem[] = [];
  dashboardLoading = false;
  dashboardError   = '';
  dashboardSearch  = '';

  // ── Detail (existing) ──────────────────────────────────────────────────
  articles: ArticleSummary[] = [];
  selectedArticle = '';
  result: PredictionResult | null = null;
  loading = false;
  loadingArticles = false;
  error = '';
  private chart: any = null;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadArticles();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // ── Dashboard methods ──────────────────────────────────────────────────

  loadDashboard(): void {
    this.dashboardLoading = true;
    this.dashboardError = '';
    this.predictionService.getDashboard().subscribe({
      next: (resp) => {
        this.dashboardItems = resp.data ?? [];
        this.dashboardLoading = false;
      },
      error: () => {
        this.dashboardError = 'Impossible de charger le tableau de bord.';
        this.dashboardLoading = false;
      }
    });
  }

  openDetail(item: ArticleDashboardItem): void {
    this.selectedArticle = item.designation;
    this.activeTab = 'detail';
    this.predict();
  }

  get filteredDashboard(): ArticleDashboardItem[] {
    const term = this.dashboardSearch.trim().toLowerCase();
    return term
      ? this.dashboardItems.filter(i => i.designation.toLowerCase().includes(term))
      : this.dashboardItems;
  }

  get critiques(): ArticleDashboardItem[] {
    return this.filteredDashboard.filter(i => i.urgence === 'CRITIQUE');
  }
  get alertes(): ArticleDashboardItem[] {
    return this.filteredDashboard.filter(i => i.urgence === 'ALERTE');
  }
  get ok(): ArticleDashboardItem[] {
    return this.filteredDashboard.filter(i => i.urgence === 'OK');
  }

  dashboardUrgenceClass(item: ArticleDashboardItem): string {
    if (item.urgence === 'CRITIQUE') return 'dash-card critique';
    if (item.urgence === 'ALERTE')   return 'dash-card alerte';
    return 'dash-card ok';
  }

  stockBarPct(item: ArticleDashboardItem): number {
    const max = Math.max(item.stockActuel, item.stockMinimum, 1) * 1.2;
    return Math.min((item.stockActuel / max) * 100, 100);
  }

  stockMinPct(item: ArticleDashboardItem): number {
    const max = Math.max(item.stockActuel, item.stockMinimum, 1) * 1.2;
    return Math.min((item.stockMinimum / max) * 100, 100);
  }

  // ── Detail methods (unchanged) ─────────────────────────────────────────

  loadArticles(): void {
    this.loadingArticles = true;
    this.predictionService.getArticles().subscribe({
      next: (resp) => {
        this.articles = resp.data ?? [];
        if (this.articles.length > 0 && !this.selectedArticle) {
          this.selectedArticle = this.articles[0].designation;
        }
        this.loadingArticles = false;
      },
      error: () => {
        this.loadingArticles = false;
      }
    });
  }

  predict(): void {
    if (!this.selectedArticle) return;
    this.loading = true;
    this.error = '';
    this.result = null;
    this.chart?.destroy();
    this.chart = null;

    this.predictionService.predict(this.selectedArticle).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          this.result = resp.data;
          setTimeout(() => this.renderChart(), 100);
        } else {
          this.error = resp.message || 'Erreur lors de la prédiction.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Le service IA est indisponible. Vérifiez que dindor-ai est démarré.';
      }
    });
  }

  renderChart(): void {
    if (!this.result || !this.chartRef) return;
    this.chart?.destroy();

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const histMap = new Map(this.result.historique.map(h => [h.date, h.prix ?? 0]));
    const fcMap   = new Map(this.result.forecastChart.map((f: ForecastPoint) => [f.date, f]));

    const allDates = Array.from(new Set([
      ...this.result.historique.map(h => h.date),
      ...this.result.forecastChart.map((f: ForecastPoint) => f.date)
    ])).sort();

    const histData: (number | null)[] = allDates.map(d => histMap.has(d) ? histMap.get(d)! : null);
    const predData: (number | null)[] = allDates.map(d => fcMap.has(d) ? fcMap.get(d)!.prix_predit : null);
    const minData:  (number | null)[] = allDates.map(d => fcMap.has(d) ? fcMap.get(d)!.prix_min    : null);
    const maxData:  (number | null)[] = allDates.map(d => fcMap.has(d) ? fcMap.get(d)!.prix_max    : null);

    const lastHist = this.result.historique.at(-1);
    if (lastHist) {
      const bridgeIdx = allDates.indexOf(lastHist.date);
      if (bridgeIdx !== -1 && predData[bridgeIdx] === null) {
        predData[bridgeIdx] = lastHist.prix ?? 0;
        minData[bridgeIdx]  = lastHist.prix ?? 0;
        maxData[bridgeIdx]  = lastHist.prix ?? 0;
      }
    }

    const labels = allDates.map(d => {
      const parts = d.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Historique (DT)', data: histData, borderColor: '#8B1A1A',
            backgroundColor: 'rgba(139,26,26,0.08)', borderWidth: 2,
            pointRadius: 4, pointHoverRadius: 6, tension: 0.3, fill: false, spanGaps: false },
          { label: 'Prévision (DT)', data: predData, borderColor: '#C9A227',
            backgroundColor: 'rgba(201,162,39,0.10)', borderWidth: 2.5, borderDash: [6,3],
            pointRadius: 4, pointHoverRadius: 6, tension: 0.3, fill: false, spanGaps: false },
          { label: 'Max IC', data: maxData, borderColor: 'rgba(201,162,39,0.3)',
            backgroundColor: 'rgba(201,162,39,0.10)', borderWidth: 1,
            pointRadius: 0, tension: 0.3, fill: '+1', spanGaps: false },
          { label: 'Min IC', data: minData, borderColor: 'rgba(201,162,39,0.3)',
            backgroundColor: 'rgba(201,162,39,0.10)', borderWidth: 1,
            pointRadius: 0, tension: 0.3, fill: false, spanGaps: false }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { filter: (item: any) => !['Max IC','Min IC'].includes(item.text) } },
          tooltip: { callbacks: {
            label: (ctx: any) => {
              if (['Max IC','Min IC'].includes(ctx.dataset.label)) return '';
              const v = ctx.parsed?.y;
              return v != null ? `${ctx.dataset.label}: ${(+v).toFixed(3)} DT` : '';
            }
          }}
        },
        scales: {
          x: { type: 'category', title: { display: true, text: 'Date' }, ticks: { maxTicksLimit: 12, maxRotation: 45 } },
          y: { title: { display: true, text: 'Prix unitaire (DT)' }, ticks: { callback: (v: any) => (+v).toFixed(3) + ' DT' } }
        }
      }
    });
  }

  getRecommandationClass(): string {
    const r = this.result?.recommendation ?? '';
    if (r === 'ACHETER_URGENT')          return 'badge-urgent';
    if (r === 'ACHETER_MAINTENANT')      return 'badge-buy';
    if (r === 'ACHETER_PROGRESSIVEMENT') return 'badge-buy-prog';
    if (r === 'ATTENDRE')                return 'badge-hold';
    if (r === 'SURVEILLER')              return 'badge-watch';
    return 'badge-unknown';
  }

  getRecommandationLabel(): string {
    const r = this.result?.recommendation ?? '';
    if (r === 'ACHETER_URGENT')          return 'Achat Urgent';
    if (r === 'ACHETER_MAINTENANT')      return 'Acheter Maintenant';
    if (r === 'ACHETER_PROGRESSIVEMENT') return 'Acheter Progressivement';
    if (r === 'ATTENDRE')                return 'Attendre';
    if (r === 'SURVEILLER')              return 'Surveiller';
    if (r === 'DONNEES_INSUFFISANTES')   return 'Données insuffisantes';
    return r;
  }

  getTendanceIcon(): string {
    const r = this.result?.recommendation ?? '';
    const t = this.result?.tendance ?? '';
    if (r === 'ACHETER_URGENT')      return 'warning';
    if (t === 'hausse')              return 'trending_up';
    if (t === 'baisse')              return 'trending_down';
    if (t === 'stable_puis_hausse')  return 'show_chart';
    return 'remove';
  }

  getConfianceBar(): number { return Math.round((this.result?.confiance ?? 0) * 100); }

  getStockStatusClass(): string {
    if (!this.result) return '';
    if (this.result.stockCritique) return 'stock-critical';
    if (this.result.stockActuel <= this.result.stockMinimum * 1.5) return 'stock-low';
    return 'stock-ok';
  }

  getStockStatusIcon(): string {
    if (!this.result) return 'inventory_2';
    if (this.result.stockCritique) return 'warning';
    if (this.result.stockActuel <= this.result.stockMinimum * 1.5) return 'inventory_2';
    return 'check_circle';
  }

  stockMinPercent(): number {
    if (!this.result) return 0;
    const max = Math.max(this.result.stockActuel, this.result.stockMinimum) * 1.3 || 1;
    return Math.min((this.result.stockMinimum / max) * 100, 100);
  }

  stockFillPercent(): number {
    if (!this.result) return 0;
    const max = Math.max(this.result.stockActuel, this.result.stockMinimum) * 1.3 || 1;
    return Math.min((this.result.stockActuel / max) * 100, 100);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getSourceLabel(): string {
    if (!this.result) return '';
    const db = this.result.nbPointsDb ?? 0;
    const xl = this.result.nbPointsExcel ?? 0;
    const parts: string[] = [];
    if (db > 0) parts.push(`${db} pts base`);
    if (xl > 0) parts.push(`${xl} pts Excel`);
    return parts.join(' + ') || 'Aucun historique';
  }
}
