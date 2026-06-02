import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FournisseurService } from '../../../services/fournisseur.service';
import { FournisseurEtat, TransactionFournisseur, PaiementFournisseurRequest } from '../../../models/fournisseur-etat.model';
import { Fournisseur } from '../../../models/fournisseur.model';

@Component({
  selector: 'app-etat-fournisseur',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './etat-fournisseur.component.html',
  styleUrl: './etat-fournisseur.component.css'
})
export class EtatFournisseurComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Liste fournisseurs ───────────────────────────────────────────────────
  etats: FournisseurEtat[] = [];
  filteredEtats: FournisseurEtat[] = [];
  isLoading = false;
  searchTerm = '';
  showOnlyCredit = false;

  // ── Fournisseur sélectionné ──────────────────────────────────────────────
  selectedEtat: FournisseurEtat | null = null;
  fournisseurDetails: Fournisseur | null = null;
  transactions: TransactionFournisseur[] = [];
  filteredTransactions: TransactionFournisseur[] = [];
  isLoadingDetail = false;

  // ── Filtres période ──────────────────────────────────────────────────────
  dateDebutFiltre = '';
  dateFinFiltre   = '';

  // ── Modal paiement ───────────────────────────────────────────────────────
  showPaiementModal = false;
  isSaving = false;
  formError = '';
  paiementForm!: FormGroup;

  constructor(
    private fournisseurService: FournisseurService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void { this.loadEtats(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ────────────────────────────────────────────────────────────

  loadEtats(): void {
    this.isLoading = true;
    this.fournisseurService.getEtatFournisseurs().pipe(takeUntil(this.destroy$)).subscribe({
      next: list => {
        this.etats = (list ?? []).sort((a, b) => (b.solde ?? 0) - (a.solde ?? 0));
        this.applyFournisseurFilter();
        this.isLoading = false;
        if (this.selectedEtat) {
          const updated = this.etats.find(e => e.fournisseurId === this.selectedEtat!.fournisseurId);
          if (updated) this.selectedEtat = updated;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFournisseurFilter(): void {
    let list = this.etats;
    if (this.showOnlyCredit) list = list.filter(e => (e.solde ?? 0) > 0);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.nom.toLowerCase().includes(q) || (e.matricule ?? '').toLowerCase().includes(q));
    }
    this.filteredEtats = list;
  }

  // ── Sélection fournisseur ─────────────────────────────────────────────────

  selectFournisseur(e: FournisseurEtat): void {
    this.selectedEtat = e;
    this.fournisseurDetails = null;
    this.transactions = [];
    this.filteredTransactions = [];
    this.isLoadingDetail = true;
    this.fournisseurService.getById(e.fournisseurId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.fournisseurDetails = d; }, error: () => {} });
    this.fournisseurService.getTransactionsByFournisseur(e.fournisseurId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: list => {
          this.transactions = list ?? [];
          this.applyDateFilter();
          this.isLoadingDetail = false;
        },
        error: () => { this.isLoadingDetail = false; }
      });
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  applyDateFilter(): void {
    let list = this.transactions;
    if (this.dateDebutFiltre) list = list.filter(t => t.date >= this.dateDebutFiltre);
    if (this.dateFinFiltre)   list = list.filter(t => t.date <= this.dateFinFiltre);
    this.filteredTransactions = list;
  }

  resetDateFilter(): void {
    this.dateDebutFiltre = '';
    this.dateFinFiltre   = '';
    this.filteredTransactions = [...this.transactions];
  }

  // ── Totaux ────────────────────────────────────────────────────────────────

  get totalDebit(): number  { return this.filteredTransactions.reduce((s, t) => s + (t.debit  || 0), 0); }
  get totalCredit(): number { return this.filteredTransactions.reduce((s, t) => s + (t.credit || 0), 0); }
  get soldeNet(): number    { return this.totalDebit - this.totalCredit; }
  get grandTotal(): number  { return this.etats.reduce((s, e) => s + (e.solde ?? 0), 0); }
  get fournisseursAvecSolde(): number { return this.etats.filter(e => (e.solde ?? 0) > 0).length; }

  get totalEspeces(): number {
    return this.filteredTransactions
      .filter(t => { const m = (t.modePaiement||t.type||'').toLowerCase(); return m==='espece'||m==='espèces'; })
      .reduce((s, t) => s + (t.credit || 0), 0);
  }

  get totalCheques(): number {
    return this.filteredTransactions
      .filter(t => { const m = (t.modePaiement||t.type||'').toLowerCase(); return m==='cheque'||m==='chèque'; })
      .reduce((s, t) => s + (t.credit || 0), 0);
  }

  get totalTraitesPaie(): number {
    return this.filteredTransactions
      .filter(t => (t.modePaiement||t.type||'').toLowerCase() === 'traite')
      .reduce((s, t) => s + (t.credit || 0), 0);
  }

  // ── Modal paiement ────────────────────────────────────────────────────────

  openPaiementModal(numeroFacture = '', montantFacture?: number): void {
    const solde = this.selectedEtat?.solde ?? 0;
    const defaultMontant = montantFacture !== undefined ? montantFacture : (solde > 0 ? solde : 0);
    this.paiementForm = this.fb.group({
      modePaiement:   ['ESPECE', Validators.required],
      montant:        [defaultMontant > 0 ? defaultMontant.toFixed(3) : '', [Validators.required, Validators.min(0.001)]],
      datePaiement:   [new Date().toISOString().slice(0, 10), Validators.required],
      numeroPaiement: [''],
      echeance:       [''],
      banque:         [''],
      numeroFacture:  [numeroFacture],
      remarque:       [''],
    });
    this.formError = '';
    this.showPaiementModal = true;
  }

  fillToutRegler(): void {
    const solde = this.selectedEtat?.solde ?? 0;
    if (solde > 0) this.paiementForm.get('montant')?.setValue(solde.toFixed(3));
  }

  closePaiementModal(): void { this.showPaiementModal = false; }
  closeModalOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.closePaiementModal(); }

  submitPaiement(): void {
    if (this.paiementForm.invalid) { this.paiementForm.markAllAsTouched(); return; }
    if (!this.selectedEtat) return;
    this.isSaving = true;
    this.formError = '';
    const v = this.paiementForm.value;
    const payload: PaiementFournisseurRequest = {
      montant:        parseFloat(v.montant),
      datePaiement:   v.datePaiement,
      modePaiement:   v.modePaiement,
      numeroPaiement: v.numeroPaiement || undefined,
      echeance:       v.echeance || undefined,
      banque:         v.banque || undefined,
      remarque:       v.remarque || undefined,
      numeroFacture:  v.numeroFacture || undefined,
    };
    const fournisseurId = this.selectedEtat.fournisseurId;
    this.fournisseurService.addPaiement(fournisseurId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.closePaiementModal();
          this.loadEtats();
          setTimeout(() => {
            const updated = this.etats.find(x => x.fournisseurId === fournisseurId);
            if (updated) this.selectFournisseur(updated);
          }, 600);
        },
        error: err => {
          this.isSaving = false;
          this.formError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        }
      });
  }

  deletePaiement(paiementFournisseurId: number): void {
    if (!confirm('Supprimer ce règlement ?')) return;
    this.fournisseurService.deletePaiement(paiementFournisseurId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { if (this.selectedEtat) this.selectFournisseur(this.selectedEtat); },
        error: () => alert('Impossible de supprimer ce règlement.')
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  imprimerReleve(): void { window.print(); }

  formatNum(v: number | null | undefined, dec = 3): string {
    if (v == null) return '0.000';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  modeLabel(m: string): string {
    const map: Record<string, string> = {
      ESPECE: 'Espèces', CHEQUE: 'Chèque', TRAITE: 'Traite',
      Espèces: 'Espèces', Crédit: 'Crédit', Achat: 'Achat', Règlement: 'Règlement'
    };
    return map[m] ?? m;
  }

  initials(nom: string): string { return (nom ?? '?').charAt(0).toUpperCase(); }

  isEcheanceProche(d: string | null | undefined): boolean {
    if (!d) return false;
    const diff = (new Date(d).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }

  isEcheanceDepassee(d: string | null | undefined): boolean {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  }

  rowClass(t: TransactionFournisseur): string {
    const m = (t.modePaiement || t.type || '').toLowerCase();
    if (m === 'traite')  return 'row-traite';
    if (m === 'cheque' || m === 'chèque') return 'row-cheque';
    if (m === 'espece' || m === 'espèces') return 'row-espece';
    return 'row-paiement';
  }

  paymentIcon(t: TransactionFournisseur): string {
    const m = (t.modePaiement || t.type || '').toLowerCase();
    if (m === 'traite') return 'account_balance';
    if (m === 'cheque' || m === 'chèque') return 'receipt';
    return 'payments';
  }

  typeChipClass(t: TransactionFournisseur): string {
    const m = (t.modePaiement || t.type || '').toLowerCase();
    if (m === 'achat')    return 'chip-achat';
    if (m === 'espèces' || m === 'espece') return 'chip-espece';
    if (m === 'traite')   return 'chip-traite';
    if (m === 'crédit' || m === 'credit') return 'chip-credit';
    if (m === 'chèque' || m === 'cheque') return 'chip-cheque';
    return 'chip-reglement';
  }
}
