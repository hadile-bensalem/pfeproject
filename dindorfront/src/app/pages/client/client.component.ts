import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Client, ClientEtat } from '../../models/client.model';
import { AncienFactureClientForm } from '../../models/ancien-facture-client.model';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css'
})
export class ClientComponent implements OnInit {
  clients: Client[] = [];
  etatClients: ClientEtat[] = [];
  filteredEtat: ClientEtat[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  isModalClientOpen = false;
  isEditingClient = false;
  clientForm!: FormGroup;

  isAncienFactureModalOpen = false;
  ancienFactureMessage = '';
  ancienFactureForm!: FormGroup;

  isBonLivraisonModalOpen = false;
  bonLivraisonForm!: FormGroup;

  isClientCrediteurModalOpen = false;
  clientsCrediteurs: ClientEtat[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientService: ClientService
  ) {
    this.buildClientForm();
    this.buildAncienFactureForm();
    this.buildBonLivraisonForm();
  }

  private buildClientForm(): void {
    this.clientForm = this.fb.group({
      id: [0],
      codeClient: ['', [Validators.required, Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.maxLength(255)]],
      adresse: ['', [Validators.maxLength(500)]],
      telephone: ['', [Validators.maxLength(30)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      observations: ['', [Validators.maxLength(1000)]]
    });
  }

  private buildAncienFactureForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.ancienFactureForm = this.fb.group({
      numeroFacture: ['', [Validators.required]],
      date: [today, [Validators.required]],
      clientId: [null as number | null, [Validators.required]],
      montantHT: [0, [Validators.required, Validators.min(0)]],
      tauxTva: [0, [Validators.min(0), Validators.max(100)]],
      montantTva: [0, [Validators.min(0)]],
      timbre1: [0, [Validators.min(0)]],
      timbre2: [0, [Validators.min(0)]],
      timbre3: [0, [Validators.min(0)]]
    });
    this.ancienFactureForm.get('montantHT')?.valueChanges.subscribe(() => this.recalcTva());
    this.ancienFactureForm.get('tauxTva')?.valueChanges.subscribe(() => this.recalcTva());
  }

  private buildBonLivraisonForm(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.bonLivraisonForm = this.fb.group({
      numeroBL: ['', [Validators.required]],
      date: [today, [Validators.required]],
      clientId: [null as number | null, [Validators.required]],
      remarques: ['']
    });
  }

  private recalcTva(): void {
    const ht = Number(this.ancienFactureForm.get('montantHT')?.value) || 0;
    const taux = Number(this.ancienFactureForm.get('tauxTva')?.value) || 0;
    this.ancienFactureForm.patchValue({ montantTva: Math.round(ht * taux / 100 * 100) / 100 }, { emitEvent: false });
  }

  get montantFactureTotal(): number {
    const c = this.ancienFactureForm?.value;
    if (!c) return 0;
    return (Number(c.montantHT) || 0) + (Number(c.montantTva) || 0) +
      (Number(c.timbre1) || 0) + (Number(c.timbre2) || 0) + (Number(c.timbre3) || 0);
  }

  ngOnInit(): void {
    this.loadEtatClients();
  }

  private loadEtatClients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clientService.getEtatClients().subscribe({
      next: (data) => {
        this.etatClients = data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des clients.';
        this.isLoading = false;
      }
    });
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredEtat = [...this.etatClients];
      return;
    }
    this.filteredEtat = this.etatClients.filter(e =>
      e.codeClient.toLowerCase().includes(term) || e.nomClient.toLowerCase().includes(term)
    );
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  // --- Bouton Ajouter un Client ---
  openAddClientModal(): void {
    this.isEditingClient = false;
    this.clientForm.reset({
      id: 0,
      codeClient: this.generateCodeClient(),
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      observations: ''
    });
    this.isModalClientOpen = true;
  }

  private generateCodeClient(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const code = now.getFullYear().toString() + pad(now.getMonth() + 1) + pad(now.getDate()) +
      pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    return `C${code}`;
  }

  closeClientModal(): void {
    this.isModalClientOpen = false;
  }

  onSubmitClient(): void {
    if (this.clientForm.invalid) return;
    const v = this.clientForm.value;
    const payload = {
      codeClient: v.codeClient,
      nom: v.nom,
      adresse: v.adresse || '',
      telephone: v.telephone || '',
      email: v.email || '',
      observations: v.observations || ''
    };
    if (this.isEditingClient && v.id) {
      this.clientService.update(v.id, payload).subscribe({
        next: (updated) => {
          const idx = this.etatClients.findIndex(e => e.clientId === updated.id);
          if (idx !== -1) {
            this.etatClients[idx] = { ...this.etatClients[idx], codeClient: updated.codeClient, nomClient: updated.nom };
          }
          this.applyFilter();
          this.closeClientModal();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.'
      });
    } else {
      this.clientService.create(payload).subscribe({
        next: (created) => {
          this.etatClients = [{ clientId: created.id, codeClient: created.codeClient, nomClient: created.nom, solde: 0, traitementEnCours: 0 }, ...this.etatClients];
          this.applyFilter();
          this.closeClientModal();
        },
        error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la création.'
      });
    }
  }

  editClient(e: ClientEtat): void {
    this.clientService.getById(e.clientId).subscribe({
      next: (c) => {
        if (c) {
          this.clientForm.patchValue({
            id: c.id,
            codeClient: c.codeClient,
            nom: c.nom,
            adresse: c.adresse,
            telephone: c.telephone,
            email: c.email,
            observations: c.observations
          });
          this.isEditingClient = true;
          this.isModalClientOpen = true;
        }
      }
    });
  }

  deleteClient(e: ClientEtat): void {
    if (!confirm(`Supprimer le client ${e.nomClient} ?`)) return;
    this.clientService.delete(e.clientId).subscribe({
      next: () => {
        this.etatClients = this.etatClients.filter(x => x.clientId !== e.clientId);
        this.applyFilter();
      },
      error: (err) => this.errorMessage = err?.error?.message || 'Erreur lors de la suppression.'
    });
  }

  // --- Ancien Facture Client ---
  openAncienFactureModal(): void {
    this.clientService.getAll().subscribe({
      next: (list) => { this.clients = list; }
    });
    this.ancienFactureForm.reset({
      numeroFacture: '',
      date: new Date().toISOString().slice(0, 10),
      clientId: null,
      montantHT: 0,
      tauxTva: 0,
      montantTva: 0,
      timbre1: 0,
      timbre2: 0,
      timbre3: 0
    });
    this.ancienFactureMessage = '';
    this.isAncienFactureModalOpen = true;
  }

  closeAncienFactureModal(): void {
    this.isAncienFactureModalOpen = false;
  }

  onAncienFactureAjouter(): void {
    if (this.ancienFactureForm.invalid) {
      this.ancienFactureMessage = 'Veuillez renseigner le N° facture et le client.';
      return;
    }
    this.ancienFactureMessage = '';
    const v = this.ancienFactureForm.value as AncienFactureClientForm;
    this.clientService.saveAncienFactureClient(v).subscribe({
      next: () => {
        this.ancienFactureForm.reset({ ...this.ancienFactureForm.value, numeroFacture: '', montantHT: 0, montantTva: 0, timbre1: 0, timbre2: 0, timbre3: 0 });
        this.ancienFactureMessage = 'Facture enregistrée.';
      }
    });
  }

  onAncienFactureValider(): void {
    if (this.ancienFactureForm.invalid) {
      this.ancienFactureMessage = 'Veuillez renseigner le N° facture et le client.';
      return;
    }
    const v = this.ancienFactureForm.value as AncienFactureClientForm;
    this.clientService.saveAncienFactureClient(v).subscribe({
      next: () => this.closeAncienFactureModal()
    });
  }

  onAncienFactureSupprimer(): void {
    this.ancienFactureForm.patchValue({
      numeroFacture: '',
      montantHT: 0,
      tauxTva: 0,
      montantTva: 0,
      timbre1: 0,
      timbre2: 0,
      timbre3: 0
    });
    this.ancienFactureMessage = 'Saisie réinitialisée.';
  }

  // --- Bon de Livraison ---
  openBonLivraisonModal(): void {
    this.clientService.getAll().subscribe({ next: (list) => { this.clients = list; } });
    this.bonLivraisonForm.reset({
      numeroBL: '',
      date: new Date().toISOString().slice(0, 10),
      clientId: null,
      remarques: ''
    });
    this.isBonLivraisonModalOpen = true;
  }

  closeBonLivraisonModal(): void {
    this.isBonLivraisonModalOpen = false;
  }

  onSubmitBonLivraison(): void {
    if (this.bonLivraisonForm.invalid) return;
    // TODO: appeler API bon de livraison
    this.closeBonLivraisonModal();
  }

  // --- Client Créditeur ---
  openClientCrediteurModal(): void {
    this.clientsCrediteurs = this.etatClients.filter(e => e.solde > 0);
    this.isClientCrediteurModalOpen = true;
  }

  closeClientCrediteurModal(): void {
    this.isClientCrediteurModalOpen = false;
  }

  formatMontant(value: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  goToDetail(e: ClientEtat): void {
    this.router.navigate(['/client/detail', e.clientId]);
  }
}
