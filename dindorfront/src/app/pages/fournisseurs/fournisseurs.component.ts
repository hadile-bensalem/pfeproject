import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Fournisseur } from '../../models/fournisseur.model';
import { FournisseurService } from '../../services/fournisseur.service';
import { AncienFactureForm } from '../../models/ancien-facture.model';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './fournisseurs.component.html',
  styleUrl: './fournisseurs.component.css'
})
export class FournisseursComponent implements OnInit {
  constructor(
    private router: Router,
    private fournisseurService: FournisseurService
  ) {}

  // Données
  fournisseurs: Fournisseur[] = [];
  filteredFournisseurs: Fournisseur[] = [];

  // Modèle du formulaire
  current: Fournisseur = this.createEmptyFournisseur();
  isEditing = false;
  isModalOpen = false;
  isAncienFactureModalOpen = false;
  isLoading = false;
  errorMessage = '';
  ancienFactureMessage = '';

  // Formulaire Ancien Facture
  ancienFacture: AncienFactureForm = this.createEmptyAncienFacture();

  // Recherche / filtre
  searchTerm = '';

  private createEmptyFournisseur(): Fournisseur {
    return {
      id: 0,
      matricule: '',
      raisonSociale: '',
      adresse: '',
      codeTVA: '',
      telephone1: '',
      telephone2: '',
      email: '',
      responsableContact: '',
      devise: '',
      observations: '',
      avecRS: false,
      dateCreation: '',
      dateModification: ''
    };
  }

  private createEmptyAncienFacture(): AncienFactureForm {
    return {
      numeroFacture: '',
      date: this.formatDateForInput(new Date()),
      fournisseurId: null,
      montantHT: 0,
      tauxTva: 0,
      montantTva: 0,
      timbre1: 0,
      timbre2: 0,
      timbre3: 0
    };
  }

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Montant total de la facture (lecture seule) */
  get montantFactureTotal(): number {
    const a = this.ancienFacture;
    const ht = Number(a.montantHT) || 0;
    const tva = Number(a.montantTva) || 0;
    const t1 = Number(a.timbre1) || 0;
    const t2 = Number(a.timbre2) || 0;
    const t3 = Number(a.timbre3) || 0;
    return ht + tva + t1 + t2 + t3;
  }

  /** Recalcule le montant TVA à partir du HT et du taux */
  onAncienFactureTvaRecalc(): void {
    const ht = Number(this.ancienFacture.montantHT) || 0;
    const taux = Number(this.ancienFacture.tauxTva) || 0;
    this.ancienFacture.montantTva = Math.round(ht * taux / 100 * 100) / 100;
  }

  private generateMatricule(): string {
    // Génère une matricule unique basée sur le timestamp (ex: F20250203153022)
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const code =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    return `F${code}`;
  }

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  private loadFournisseurs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fournisseurService.getAll().subscribe({
      next: (data) => {
        this.fournisseurs = data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des fournisseurs.';
        this.isLoading = false;
      }
    });
  }

  openNewModal(): void {
    this.isEditing = false;
    this.current = this.createEmptyFournisseur();
    this.current.matricule = this.generateMatricule();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onEnregistrer(): void {
    if (!this.current.matricule || !this.current.raisonSociale) {
      return;
    }

    this.errorMessage = '';

    const payload: Partial<Fournisseur> = {
      matricule: this.current.matricule,
      raisonSociale: this.current.raisonSociale,
      adresse: this.current.adresse,
      codeTVA: this.current.codeTVA,
      telephone1: this.current.telephone1,
      telephone2: this.current.telephone2,
      email: this.current.email,
      responsableContact: this.current.responsableContact,
      devise: this.current.devise,
      observations: this.current.observations,
      avecRS: this.current.avecRS
    };

    if (this.isEditing && this.current.id) {
      this.fournisseurService.update(this.current.id, payload).subscribe({
        next: (updated) => {
          const index = this.fournisseurs.findIndex(f => f.id === updated.id);
          if (index !== -1) {
            this.fournisseurs[index] = updated;
          }
          this.applyFilter();
          this.current = this.createEmptyFournisseur();
          this.isEditing = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour du fournisseur.';
        }
      });
    } else {
      this.fournisseurService.create(payload).subscribe({
        next: (created) => {
          this.fournisseurs = [created, ...this.fournisseurs];
          this.applyFilter();
          this.current = this.createEmptyFournisseur();
          this.isEditing = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Erreur lors de la création du fournisseur.';
        }
      });
    }
  }

  onAnnuler(): void {
    this.current = this.createEmptyFournisseur();
    this.isEditing = false;
    this.closeModal();
  }

  onSupprimerCourant(): void {
    if (!this.isEditing) {
      this.current = this.createEmptyFournisseur();
      this.isEditing = false;
      this.closeModal();
      return;
    }
    if (!this.current.id) {
      return;
    }

    this.fournisseurService.delete(this.current.id).subscribe({
      next: () => {
        this.fournisseurs = this.fournisseurs.filter(f => f.id !== this.current.id);
        this.applyFilter();
        this.current = this.createEmptyFournisseur();
        this.isEditing = false;
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la suppression du fournisseur.';
      }
    });
  }

  onFermer(): void {
    this.router.navigate(['/home']);
  }

  // Actions sur la liste
  consulter(f: Fournisseur): void {
    this.current = { ...f };
    this.isEditing = false;
    this.isModalOpen = true;
  }

  modifier(f: Fournisseur): void {
    this.current = { ...f };
    this.isEditing = true;
    this.isModalOpen = true;
  }

  supprimer(f: Fournisseur): void {
    if (!f.id) {
      return;
    }

    this.fournisseurService.delete(f.id).subscribe({
      next: () => {
        this.fournisseurs = this.fournisseurs.filter(x => x.id !== f.id);
        this.applyFilter();
        if (this.current.id === f.id) {
          this.current = this.createEmptyFournisseur();
          this.isEditing = false;
          this.closeModal();
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la suppression du fournisseur.';
      }
    });
  }

  // Recherche / Filtre
  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredFournisseurs = [...this.fournisseurs];
      return;
    }
    this.filteredFournisseurs = this.fournisseurs.filter(f => {
      return (
        f.matricule.toLowerCase().includes(term) ||
        f.raisonSociale.toLowerCase().includes(term) ||
        (f.codeTVA || '').toLowerCase().includes(term) ||
        (f.telephone1 || '').toLowerCase().includes(term) ||
        (f.telephone2 || '').toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term) ||
        (f.responsableContact || '').toLowerCase().includes(term) ||
        (f.devise || '').toLowerCase().includes(term)
      );
    });
  }

  // Placeholder pour l'impression (à brancher plus tard sur un vrai export)
  onImprimer(): void {
    window.print();
  }

  // --- Ancien Facture Fournisseur (régularisation) ---
  openAncienFactureModal(): void {
    this.ancienFacture = this.createEmptyAncienFacture();
    this.ancienFactureMessage = '';
    this.isAncienFactureModalOpen = true;
  }

  closeAncienFactureModal(): void {
    this.isAncienFactureModalOpen = false;
    this.ancienFactureMessage = '';
  }

  onAncienFactureAjouter(): void {
    if (!this.ancienFacture.numeroFacture?.trim() || this.ancienFacture.fournisseurId == null) {
      this.ancienFactureMessage = 'Veuillez renseigner le N° facture et le fournisseur.';
      return;
    }
    this.ancienFactureMessage = '';
    // TODO: appeler l'API pour enregistrer l'ancienne facture
    // this.fournisseurService.saveAncienFacture(this.ancienFacture).subscribe({ ... });
    this.ancienFacture = this.createEmptyAncienFacture();
    this.ancienFactureMessage = 'Facture enregistrée. Vous pouvez en ajouter une autre ou fermer.';
  }

  onAncienFactureValider(): void {
    if (!this.ancienFacture.numeroFacture?.trim() || this.ancienFacture.fournisseurId == null) {
      this.ancienFactureMessage = 'Veuillez renseigner le N° facture et le fournisseur.';
      return;
    }
    this.ancienFactureMessage = '';
    // TODO: appeler l'API pour enregistrer et valider
    // this.fournisseurService.saveAncienFacture(this.ancienFacture).subscribe({ next: () => this.closeAncienFactureModal(); ... });
    this.closeAncienFactureModal();
  }

  onAncienFactureSupprimer(): void {
    if (this.ancienFacture.id) {
      // TODO: appeler l'API pour supprimer cette facture
      // this.fournisseurService.deleteAncienFacture(this.ancienFacture.id).subscribe({ ... });
    }
    this.ancienFacture = this.createEmptyAncienFacture();
    this.ancienFactureMessage = 'Saisie réinitialisée.';
  }

  onAncienFactureFermer(): void {
    this.closeAncienFactureModal();
  }

  formatMontantDisplay(value: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}

