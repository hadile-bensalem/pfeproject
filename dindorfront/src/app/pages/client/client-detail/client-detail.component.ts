import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Client } from '../../../models/client.model';
import { TransactionClient } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css'
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  clientId: number | null = null;
  client: Client | null = null;
  transactions: TransactionClient[] = [];
  filteredTransactions: TransactionClient[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  sortColumn: keyof TransactionClient | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  totalGeneral = 0;
  solde = 0;
  totalDebit = 0;
  totalCredit = 0;
  showDeleteConfirm = false;
  transactionToDelete: TransactionClient | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.clientId = id ? +id : null;
    if (this.clientId) {
      this.loadClient();
      this.loadTransactions();
    } else {
      this.errorMessage = 'Client non trouvé.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadClient(): void {
    if (!this.clientId) return;
    this.clientService.getById(this.clientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (c) => this.client = c,
      error: () => this.client = null
    });
  }

  private loadTransactions(): void {
    if (!this.clientId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.clientService.getTransactionsByClient(this.clientId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.transactions = data ?? [];
        this.computeResume();
        this.applyFilterAndSort();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des transactions.';
        this.isLoading = false;
      }
    });
  }

  private computeResume(): void {
    this.totalDebit = this.transactions.reduce((s, t) => s + (t.debit || 0), 0);
    this.totalCredit = this.transactions.reduce((s, t) => s + (t.credit || 0), 0);
    this.totalGeneral = this.totalDebit + this.totalCredit;
    this.solde = this.totalCredit - this.totalDebit; // client: crédit - débit = solde client
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let list = [...this.transactions];
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(t =>
        (t.numeroFacture || '').toLowerCase().includes(term) ||
        (t.modePaiement || '').toLowerCase().includes(term)
      );
    }
    if (this.sortColumn) {
      list.sort((a, b) => {
        const va = a[this.sortColumn as keyof TransactionClient];
        const vb = b[this.sortColumn as keyof TransactionClient];
        let cmp = 0;
        if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
        else if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb);
        else cmp = String(va ?? '').localeCompare(String(vb ?? ''));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    this.filteredTransactions = list;
  }

  sortBy(column: keyof TransactionClient): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const j = d.getDate().toString().padStart(2, '0');
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const a = d.getFullYear();
    return `${j}/${m}/${a}`;
  }

  formatMontant(value: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  getModeLabel(code: string): string {
    const map: Record<string, string> = {
      TRA: 'Transfert',
      ESP: 'Espèces',
      CHQ: 'Chèque',
      CB: 'Carte bancaire',
      VIR: 'Virement'
    };
    return map[code?.toUpperCase()] || code || '—';
  }

  openDeleteConfirm(t: TransactionClient): void {
    this.transactionToDelete = t;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.transactionToDelete = null;
  }

  confirmDelete(): void {
    if (!this.transactionToDelete) {
      this.closeDeleteConfirm();
      return;
    }
    const id = this.transactionToDelete.id;
    this.clientService.deleteTransaction(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.transactions = this.transactions.filter(tr => tr.id !== id);
        this.computeResume();
        this.applyFilterAndSort();
        this.closeDeleteConfirm();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression de la transaction.';
        this.closeDeleteConfirm();
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/client']);
  }

  soldeClass(): string {
    if (this.solde >= 0) return 'solde-ok';
    if (this.solde > -1000) return 'solde-warning';
    return 'solde-alert';
  }
}
