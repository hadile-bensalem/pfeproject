import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { AdminInfo } from '../../models/auth.model';
import { FactureClientService } from '../../services/facture-client.service';
import { StockService } from '../../services/stock.service';
import { FactureClient } from '../../models/facture-client.model';
import { StockArticle } from '../../models/stock.model';
import { AnalyticsService, CaMensuel, TopClient, TopArticle, RecouvrementStats } from '../../services/analytics.service';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService           = inject(AuthService);
  private tokenService          = inject(TokenService);
  private factureClientService  = inject(FactureClientService);
  private stockService          = inject(StockService);
  private analyticsService      = inject(AnalyticsService);

  adminInfo: AdminInfo | null = null;
  today = new Date();

  // ── KPI data ──────────────────────────────────────────
  caJour             = 0;
  caAnnee            = 0;
  nombreBons         = 0;
  montantCreditJour  = 0;
  nombreArticles     = 0;
  articlesAlerte     = 0;
  valeurStock        = 0;

  // ── Tables ────────────────────────────────────────────
  recentFactures: FactureClient[] = [];
  stockAlertes:   StockArticle[]  = [];

  isLoadingVente  = false;
  isLoadingStock  = false;

  // ── Analytics tab ─────────────────────────────────────────
  activeTab: 'apercu' | 'analytique' = 'apercu';
  anneeAnalytique = new Date().getFullYear();
  isLoadingAnalytics = false;

  caMensuel:    CaMensuel[]          = [];
  topClients:   TopClient[]          = [];
  topArticles:  TopArticle[]         = [];
  recouvrement: RecouvrementStats | null = null;

  private chartCA:       any = null;
  private chartClients:  any = null;
  private chartArticles: any = null;
  private chartRecouvre: any = null;

  get todayLabel(): string {
    return this.today.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get todayIso(): string {
    return this.today.toISOString().slice(0, 10);
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  get currentYear(): number {
    return this.today.getFullYear();
  }

  ngOnInit(): void {
    this.adminInfo = this.authService.getAdminInfo();
    if (!this.adminInfo) {
      this.authService.getCurrentAdmin().subscribe({
        next: r => { if (r.success && r.data) { this.adminInfo = r.data; this.tokenService.setAdminInfo(r.data); } }
      });
    }
    this.loadAll();
  }

  loadAll(): void {
    this.loadVenteData();
    this.loadStockData();
    this.loadAnnualCA();
  }

  loadVenteData(): void {
    this.isLoadingVente = true;
    const t = this.todayIso;
    this.factureClientService.getStats(t, t).subscribe({
      next: s => {
        this.caJour            = s?.chiffreAffaire ?? 0;
        this.nombreBons        = s?.nombreBons     ?? 0;
        this.montantCreditJour = s?.montantCredit  ?? 0;
        this.isLoadingVente    = false;
      },
      error: () => { this.isLoadingVente = false; }
    });
    this.factureClientService.getFactures(t, t, undefined, 'BON_LIVRAISON').subscribe({
      next: list => { this.recentFactures = (list ?? []).slice(0, 6); }
    });
  }

  private loadStockData(): void {
    this.isLoadingStock = true;
    this.stockService.getDashboard().subscribe({
      next: d => {
        this.nombreArticles = d?.nombreArticles   ?? 0;
        this.articlesAlerte = d?.articlesEnAlerte  ?? 0;
        this.valeurStock    = +(d?.valeurTotale    ?? 0);
        this.isLoadingStock = false;
      },
      error: () => { this.isLoadingStock = false; }
    });
    this.stockService.getStockArticles().subscribe({
      next: list => {
        this.stockAlertes = (list ?? [])
          .filter(a => a.enAlerte || a.enRupture)
          .slice(0, 6);
      }
    });
  }

  private loadAnnualCA(): void {
    const year = new Date().getFullYear();
    this.analyticsService.getCaMensuel(year).subscribe({
      next: data => { this.caAnnee = data.reduce((s, m) => s + (+m.ca), 0); }
    });
  }

  // ── Analytics methods ─────────────────────────────────
  switchTab(tab: 'apercu' | 'analytique'): void {
    this.activeTab = tab;
    if (tab === 'analytique') {
      setTimeout(() => this.loadAnalytics(), 50);
    }
  }

  changeAnnee(delta: number): void {
    const next = this.anneeAnalytique + delta;
    if (next > this.currentYear) return;
    this.anneeAnalytique = next;
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoadingAnalytics = true;
    const debut = `${this.anneeAnalytique}-01-01`;
    const fin   = `${this.anneeAnalytique}-12-31`;

    this.analyticsService.getCaMensuel(this.anneeAnalytique).subscribe({
      next: data => { this.caMensuel = data; this.renderChartCA(); },
      error: () => {}
    });
    this.analyticsService.getTopClients(debut, fin).subscribe({
      next: data => { this.topClients = data; this.renderChartClients(); },
      error: () => {}
    });
    this.analyticsService.getTopArticles(debut, fin).subscribe({
      next: data => { this.topArticles = data; this.renderChartArticles(); },
      error: () => { this.isLoadingAnalytics = false; }
    });
    this.analyticsService.getRecouvrement(debut, fin).subscribe({
      next: data => { this.recouvrement = data; this.renderChartRecouvre(); this.isLoadingAnalytics = false; },
      error: () => { this.isLoadingAnalytics = false; }
    });
  }

  private renderChartCA(): void {
    const canvas = document.getElementById('chartCA') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartCA) { this.chartCA.destroy(); }
    this.chartCA = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.caMensuel.map(m => m.libelle),
        datasets: [{
          label: 'CA (DT)',
          data: this.caMensuel.map(m => +m.ca),
          backgroundColor: 'rgba(81,0,13,0.75)',
          borderColor: '#51000d',
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v: any) => v.toLocaleString('fr-TN') + ' DT' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private renderChartClients(): void {
    const canvas = document.getElementById('chartClients') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartClients) { this.chartClients.destroy(); }
    const top = this.topClients.slice(0, 10);
    this.chartClients = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map(c => c.nom.length > 20 ? c.nom.substring(0, 18) + '…' : c.nom),
        datasets: [{
          label: 'CA (DT)',
          data: top.map(c => +c.ca),
          backgroundColor: ['#51000d','#7a0019','#fcd358','#DAA520','#8b2035',
                            '#a0253f','#c9a227','#6b1a2a','#e0c060','#3d000a'],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }
      }
    });
  }

  private renderChartArticles(): void {
    const canvas = document.getElementById('chartArticles') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartArticles) { this.chartArticles.destroy(); }
    const top = this.topArticles.slice(0, 8);
    this.chartArticles = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: top.map(a => a.designation.length > 22 ? a.designation.substring(0, 20) + '…' : a.designation),
        datasets: [{
          data: top.map(a => +a.qty),
          backgroundColor: ['#51000d','#fcd358','#7a0019','#DAA520','#8b2035','#c9a227','#a0253f','#e0c060'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right' as const, labels: { font: { size: 11 } } } },
        cutout: '62%'
      }
    });
  }

  private renderChartRecouvre(): void {
    const canvas = document.getElementById('chartRecouvre') as HTMLCanvasElement;
    if (!canvas || !this.recouvrement) return;
    if (this.chartRecouvre) { this.chartRecouvre.destroy(); }
    const r = this.recouvrement;
    this.chartRecouvre = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Payé', 'Partiel', 'En attente'],
        datasets: [{
          data: [r.payes, r.partiels, r.enAttente],
          backgroundColor: ['#2e7d32','#f57f17','#c62828'],
          borderWidth: 2, borderColor: '#fff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const },
          tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} BL(s)` } }
        },
        cutout: '65%'
      }
    });
  }

  ngOnDestroy(): void {
    [this.chartCA, this.chartClients, this.chartArticles, this.chartRecouvre]
      .forEach(c => { if (c) c.destroy(); });
  }

  // ── Helpers ───────────────────────────────────────────
  formatNum(val: number | null | undefined, dec = 3): string {
    if (val == null) return '—';
    return (+val).toLocaleString('fr-TN', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  etatClass(etat: string): string {
    if (etat === 'PAYE')    return 'badge-paye';
    if (etat === 'PARTIEL') return 'badge-partiel';
    return 'badge-attente';
  }

  etatLabel(etat: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'En attente', PARTIEL: 'Partiel', PAYE: 'Payé' };
    return m[etat] ?? etat;
  }
}
