import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FournisseurEtat } from '../../../models/fournisseur-etat.model';
import { FournisseurService } from '../../../services/fournisseur.service';

@Component({
  selector: 'app-etat-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './etat-fournisseur.component.html',
  styleUrl: './etat-fournisseur.component.css'
})
export class EtatFournisseurComponent implements OnInit {
  etats: FournisseurEtat[] = [];
  filteredEtats: FournisseurEtat[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  sortColumn: keyof FournisseurEtat | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fournisseurService: FournisseurService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEtats();
  }

  private loadEtats(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.fournisseurService.getEtatFournisseurs().subscribe({
      next: (data) => {
        this.etats = data ?? [];
        this.applyFilterAndSort();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement de l\'état des fournisseurs.';
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let list = [...this.etats];
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(e =>
        e.nom.toLowerCase().includes(term) ||
        e.matricule.toLowerCase().includes(term)
      );
    }
    if (this.sortColumn) {
      list.sort((a, b) => {
        const va = a[this.sortColumn as keyof FournisseurEtat];
        const vb = b[this.sortColumn as keyof FournisseurEtat];
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va ?? '').localeCompare(String(vb ?? ''));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    this.filteredEtats = list;
  }

  sortBy(column: keyof FournisseurEtat): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  goToDetail(etat: FournisseurEtat): void {
    this.router.navigate(['/fournisseurs/etat/detail', etat.fournisseurId]);
  }

  backToList(): void {
    this.router.navigate(['/fournisseurs']);
  }

  formatMontant(value: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
