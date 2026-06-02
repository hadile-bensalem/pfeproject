import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientService } from '../../services/client.service';
import { VenteService } from '../../services/vente.service';
import { Client, PaiementClient } from '../../models/client.model';
import { BonLivraison } from '../../models/vente.model';

export interface LigneCompte {
  id:              number;
  date:            string;
  type:            'BL' | 'PAIEMENT';
  numeroBL:        string;
  montant:         number;   // BL amount (0 for payments)
  acompte:         number;   // Payment amount (0 for BLs)
  solde:           number;   // Running cumulative balance
  typePaie:        string;   // 'Vente' | 'ESPECE' | 'CHEQUE' | 'TRAITE'
  numeroPaiement:  string;
  echeance:        string;
  statut?:         string;   // BL etat
  blId?:           number;
  paiementId?:     number;
}

@Component({
  selector: 'app-clients-crediteurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './clients-crediteurs.component.html',
  styleUrl: './clients-crediteurs.component.css'
})
export class ClientsCrediteurComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Liste clients ──────────────────────────────────────────────────────
  clients:         Client[] = [];
  filteredClients: Client[] = [];
  isLoading        = false;
  searchTerm       = '';
  showOnlyDebit    = false;

  // ── Client sélectionné ─────────────────────────────────────────────────
  selectedClient:  Client | null = null;
  bons:            BonLivraison[]   = [];
  paiements:       PaiementClient[] = [];
  lignesCompte:    LigneCompte[]    = [];
  filteredLignes:  LigneCompte[]    = [];
  isLoadingDetail  = false;

  // ── Filtres ────────────────────────────────────────────────────────────
  dateDebutFiltre  = '';
  dateFinFiltre    = '';

  // ── Sélection BL pour paiement ciblé ──────────────────────────────────
  selectedBLNums   = new Set<string>();

  // ── Modal paiement ─────────────────────────────────────────────────────
  showPaiementModal = false;
  isSaving          = false;
  formError         = '';
  paiementForm!:    FormGroup;
  preselectedBL     = '';

  // ── Modal BL détail ────────────────────────────────────────────────────
  showBLModal  = false;
  blDetail:    BonLivraison | null = null;
  isLoadingBL  = false;

  constructor(
    private clientService: ClientService,
    private venteService:  VenteService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void { this.loadClients(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ─────────────────────────────────────────────────────────

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: list => {
        this.clients = (list ?? []).sort((a, b) => (b.soldeTotalDu ?? 0) - (a.soldeTotalDu ?? 0));
        this.applyClientFilter();
        this.isLoading = false;
        // Re-sync selected client if any
        if (this.selectedClient) {
          const updated = this.clients.find(c => c.id === this.selectedClient!.id);
          if (updated) this.selectedClient = updated;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyClientFilter(): void {
    let list = this.clients;
    if (this.showOnlyDebit) list = list.filter(c => (c.soldeTotalDu ?? 0) > 0);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.codeClient.toLowerCase().includes(q) ||
        (c.telephone ?? '').includes(q)
      );
    }
    this.filteredClients = list;
  }

  // ── Sélection client ───────────────────────────────────────────────────

  selectClient(c: Client): void {
    this.selectedClient = c;
    this.selectedBLNums.clear();
    this.bons = [];
    this.paiements = [];
    this.lignesCompte = [];
    this.filteredLignes = [];
    this.isLoadingDetail = true;

    let bonesLoaded = false, paiesLoaded = false;

    this.clientService.getBonsByClient(c.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: bons => { this.bons = bons ?? []; bonesLoaded = true; if (paiesLoaded) this.buildCompte(); },
      error: () => { bonesLoaded = true; if (paiesLoaded) this.buildCompte(); }
    });

    this.clientService.getPaiementsByClient(c.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: p => { this.paiements = p ?? []; paiesLoaded = true; if (bonesLoaded) this.buildCompte(); },
      error: () => { paiesLoaded = true; if (bonesLoaded) this.buildCompte(); }
    });
  }

  // ── Construction du grand livre ────────────────────────────────────────

  private buildCompte(): void {
    const lines: LigneCompte[] = [];
    let seq = 1;

    for (const bl of this.bons) {
      lines.push({
        id: seq++, date: bl.dateBL, type: 'BL',
        numeroBL:       bl.numeroBL,
        montant:        +(bl.netAPayer ?? 0),
        acompte:        0,
        solde:          0,
        typePaie:       'Vente',
        numeroPaiement: '',
        echeance:       '',
        statut:         bl.etatPaiement,
        blId:           bl.id
      });

      // BL payé comptant : injecter une ligne règlement Espèces pour équilibrer le solde
      if (bl.modePaiement === 'ESPECES') {
        lines.push({
          id: seq++, date: bl.dateBL, type: 'PAIEMENT',
          numeroBL:       bl.numeroBL,
          montant:        0,
          acompte:        +(bl.netAPayer ?? 0),
          solde:          0,
          typePaie:       'ESPECES',
          numeroPaiement: '',
          echeance:       ''
        });
      }
    }

    for (const p of this.paiements) {
      lines.push({
        id: seq++, date: p.datePaiement, type: 'PAIEMENT',
        numeroBL:       p.blNumeros || 'À compte',
        montant:        0,
        acompte:        +(p.montant ?? 0),
        solde:          0,
        typePaie:       (p as any).modePaiement || 'ESPECE',
        numeroPaiement: (p as any).numeroPaiement || '',
        echeance:       (p as any).echeance || '',
        paiementId:     p.id
      });
    }

    // Tri chronologique: BL avant paiement si même date
    lines.sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : (a.type === 'BL' ? -1 : 1);
    });

    // Solde cumulatif
    let solde = 0;
    for (const l of lines) {
      solde += l.montant - l.acompte;
      l.solde = solde;
    }

    this.lignesCompte = lines;
    this.isLoadingDetail = false;
    this.applyDateFilter();
  }

  applyDateFilter(): void {
    let list = this.lignesCompte;
    if (this.dateDebutFiltre) list = list.filter(l => l.date >= this.dateDebutFiltre);
    if (this.dateFinFiltre)   list = list.filter(l => l.date <= this.dateFinFiltre);
    this.filteredLignes = list;
  }

  resetDateFilter(): void {
    this.dateDebutFiltre = '';
    this.dateFinFiltre = '';
    this.filteredLignes = [...this.lignesCompte];
  }

  // ── Totaux ─────────────────────────────────────────────────────────────

  get totalVente(): number   { return this.filteredLignes.reduce((s, l) => s + l.montant, 0); }
  get totalAcompte(): number { return this.filteredLignes.reduce((s, l) => s + l.acompte, 0); }
  get soldeNet(): number     { return this.totalVente - this.totalAcompte; }
  get totalDu(): number      { return this.clients.reduce((s, c) => s + (c.soldeTotalDu ?? 0), 0); }
  get clientsAvecSolde(): number { return this.clients.filter(c => (c.soldeTotalDu ?? 0) > 0).length; }

  // ── Sélection BL ──────────────────────────────────────────────────────

  toggleBLNum(num: string): void {
    if (this.selectedBLNums.has(num)) this.selectedBLNums.delete(num);
    else this.selectedBLNums.add(num);
  }

  get selectedBLNumsStr(): string { return Array.from(this.selectedBLNums).join(', '); }

  get selectedTotal(): number {
    return this.bons
      .filter(b => this.selectedBLNums.has(b.numeroBL))
      .reduce((s, b) => s + +(b.netAPayer ?? 0), 0);
  }

  // ── Paiement ──────────────────────────────────────────────────────────

  openPaiementModal(blNum = ''): void {
    this.preselectedBL = blNum;
    let montant: number;
    if (this.selectedBLNums.size > 0) {
      montant = this.selectedTotal;
    } else if (blNum) {
      const bl = this.bons.find(b => b.numeroBL === blNum);
      if (bl) {
          montant = +(bl.montantReste ?? 0) > 0 ? +(bl.montantReste) : +(bl.netAPayer ?? 0);
      } else {
        montant = this.selectedClient?.soldeTotalDu ?? 0;
      }
    } else {
      montant = this.selectedClient?.soldeTotalDu ?? 0;
    }
    this.paiementForm = this.fb.group({
      modePaiement:   ['ESPECE', Validators.required],
      montant:        [montant > 0 ? montant.toFixed(3) : '', [Validators.required, Validators.min(0.001)]],
      datePaiement:   [new Date().toISOString().slice(0, 10), Validators.required],
      numeroPaiement: [''],
      echeance:       [''],
      banque:         [''],
      blNumeros:      [blNum || this.selectedBLNumsStr],
      notes:          [''],
    });
    this.formError = '';
    this.showPaiementModal = true;
  }

  closePaiementModal(): void { this.showPaiementModal = false; }

  submitPaiement(): void {
    if (this.paiementForm.invalid) { this.paiementForm.markAllAsTouched(); return; }
    if (!this.selectedClient) return;
    this.isSaving = true;
    this.formError = '';
    const v = this.paiementForm.value;
    const payload: Partial<PaiementClient> = {
      montant:        parseFloat(v.montant),
      datePaiement:   v.datePaiement,
      notes:          v.notes || v.modePaiement,
      blNumeros:      v.blNumeros || undefined,
      modePaiement:   v.modePaiement,
      numeroPaiement: v.numeroPaiement || undefined,
      echeance:       v.echeance || undefined,
      banque:         v.banque || undefined,
    } as any;
    this.clientService.addPaiement(this.selectedClient.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.closePaiementModal();
          this.selectedBLNums.clear();
          const id = this.selectedClient!.id;
          this.loadClients();
          setTimeout(() => {
            const c = this.clients.find(x => x.id === id);
            if (c) this.selectClient(c);
          }, 600);
        },
        error: err => {
          this.isSaving = false;
          this.formError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        }
      });
  }

  deletePaiement(paiementId: number): void {
    if (!confirm('Supprimer ce règlement ?')) return;
    this.clientService.deletePaiement(this.selectedClient!.id, paiementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.selectClient(this.selectedClient!),
        error: err => alert(err?.error?.message || 'Impossible de supprimer.')
      });
  }

  onDeletePaiement(l: LigneCompte): void { if (l.paiementId) this.deletePaiement(l.paiementId); }

  // ── Modal BL détail ────────────────────────────────────────────────────

  openBLDetail(blId: number): void {
    this.showBLModal = true;
    this.blDetail = null;
    this.isLoadingBL = true;
    this.venteService.getById(blId).pipe(takeUntil(this.destroy$)).subscribe({
      next: bl => { this.blDetail = bl; this.isLoadingBL = false; },
      error: () => { this.isLoadingBL = false; }
    });
  }

  onBLRowClick(l: LigneCompte): void { if (l.blId) this.openBLDetail(l.blId); }
  closeBLModal(): void { this.showBLModal = false; this.blDetail = null; }

  // ── Impression ────────────────────────────────────────────────────────

  imprimerReleve(): void { window.print(); }

  // ── Helpers ───────────────────────────────────────────────────────────

  formatNum(v: number | null | undefined, dec = 3): string {
    if (v == null) return '0.000';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  modeLabel(m: string): string {
    const map: Record<string, string> = { ESPECE: 'Espèces', ESPECES: 'Espèces', CHEQUE: 'Chèque', TRAITE: 'Traite' };
    return map[m] ?? m;
  }

  etatLabel(e: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'En attente', PARTIEL: 'Partiel', PAYE: 'Payé' };
    return m[e] ?? e;
  }

  initials(nom: string): string { return nom.charAt(0).toUpperCase(); }
}
