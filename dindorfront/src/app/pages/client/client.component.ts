import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientService } from '../../services/client.service';
import { Client, PaiementClient } from '../../models/client.model';
import { BonLivraison } from '../../models/vente.model';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css'
})
export class ClientComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  clients: Client[]  = [];
  filtered: Client[] = [];
  searchTerm         = '';
  isLoading          = false;
  errorMessage       = '';

  showModal  = false;
  isEditing  = false;
  editingId  = 0;
  isSaving   = false;
  formError  = '';
  clientForm!: FormGroup;

  // ── Relevé modal ─────────────────────────────────────────
  showReleve       = false;
  releveClient: Client | null = null;
  releveBons:   BonLivraison[] = [];
  relevePaiements: PaiementClient[] = [];
  isLoadingReleve  = false;
  showPaiementForm = false;
  paiementForm!: FormGroup;
  isSavingPaiement = false;
  paiementError    = '';
  private releveLoaded = 0;

  readonly CLIENT_TYPES = [
    { value: 'ETATIQUE',      label: 'ETATIQUE',      hint: 'Abs. Timbre + PVP' },
    { value: 'CLIENT_DIVERS', label: 'CLIENT DIVERS',  hint: 'Abs. PVP' },
    { value: 'AUTRE',         label: 'AUTRE',           hint: '' },
    { value: 'AMBULANT',      label: 'AMBULANT',        hint: '' },
  ];

  get activeClientsCount(): number { return this.clients.filter(c => c.actif).length; }

  constructor(private clientService: ClientService, private fb: FormBuilder) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.clientService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.clients = list ?? []; this.applySearch(); this.isLoading = false; },
      error: () => { this.isLoading = false; this.errorMessage = 'Erreur de chargement.'; }
    });
  }

  applySearch(): void {
    const q = this.searchTerm.toLowerCase().trim();
    this.filtered = q
      ? this.clients.filter(c =>
          c.nom.toLowerCase().includes(q) ||
          c.codeClient.toLowerCase().includes(q) ||
          (c.telephone ?? '').includes(q) ||
          (c.matriculeFiscal ?? '').toLowerCase().includes(q))
      : [...this.clients];
  }

  private buildForm(c?: Client): FormGroup {
    return this.fb.group({
      typeClient:      [c?.typeClient      ?? 'AUTRE',  Validators.required],
      nom:             [c?.nom             ?? '',       Validators.required],
      responsable:     [c?.responsable     ?? ''],
      telephone:       [c?.telephone       ?? ''],
      telephone2:      [c?.telephone2      ?? ''],
      fax:             [c?.fax             ?? ''],
      email:           [c?.email           ?? ''],
      adresse:         [c?.adresse         ?? ''],
      ville:           [c?.ville           ?? ''],
      zone:            [c?.zone            ?? ''],
      matriculeFiscal: [c?.matriculeFiscal ?? ''],
      codeTVA:         [c?.codeTVA         ?? ''],
      tva:             [c?.tva             ?? null],
      prixVente:       [c?.prixVente       ?? 1],
      plafond:         [c?.plafond         ?? null],
      devise:          [c?.devise          ?? 'DT'],
      notes:           [c?.notes           ?? ''],
      actif:           [c?.actif           ?? true],
    });
  }

  openCreate(): void {
    this.isEditing  = false;
    this.editingId  = 0;
    this.formError  = '';
    this.clientForm = this.buildForm();
    this.showModal  = true;
  }

  openEdit(c: Client): void {
    this.isEditing  = true;
    this.editingId  = c.id;
    this.formError  = '';
    this.clientForm = this.buildForm(c);
    this.showModal  = true;
  }

  closeModal(): void { this.showModal = false; this.formError = ''; }

  submit(): void {
    if (this.clientForm.invalid) { this.clientForm.markAllAsTouched(); return; }
    this.isSaving  = true;
    this.formError = '';

    const obs = this.isEditing
      ? this.clientService.update(this.editingId, this.clientForm.value)
      : this.clientService.create(this.clientForm.value);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        if (!this.isEditing) { this.clientForm?.reset(); }
        this.closeModal();
        this.load();
      },
      error: err => { this.isSaving = false; this.formError = err?.error?.message || 'Erreur lors de la sauvegarde.'; }
    });
  }

  delete(c: Client): void {
    if (!confirm(`Supprimer le client ${c.codeClient} — ${c.nom} ?`)) return;
    this.clientService.delete(c.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.load(),
      error: err => alert(err?.error?.message || 'Impossible de supprimer ce client.')
    });
  }

  openReleve(c: Client): void {
    this.releveClient = c;
    this.showReleve = true;
    this.showPaiementForm = false;
    this.paiementError = '';
    this.isLoadingReleve = true;
    this.releveBons = [];
    this.relevePaiements = [];

    this.clientService.getBonsByClient(c.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: bons => { this.releveBons = bons ?? []; this.checkReleveLoaded(); },
      error: () => this.checkReleveLoaded()
    });
    this.clientService.getPaiementsByClient(c.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: p => { this.relevePaiements = p ?? []; this.checkReleveLoaded(); },
      error: () => this.checkReleveLoaded()
    });
  }

  private checkReleveLoaded(): void {
    this.releveLoaded++;
    if (this.releveLoaded >= 2) {
      this.isLoadingReleve = false;
      this.releveLoaded = 0;
    }
  }

  closeReleve(): void { this.showReleve = false; this.releveClient = null; }

  openPaiementForm(): void {
    this.showPaiementForm = true;
    this.paiementError = '';
    this.paiementForm = this.fb.group({
      montant:      [null, [Validators.required, Validators.min(0.001)]],
      datePaiement: [new Date().toISOString().slice(0, 10), Validators.required],
      notes:        [''],
      blNumeros:    ['']
    });
  }

  submitPaiement(): void {
    if (this.paiementForm.invalid) { this.paiementForm.markAllAsTouched(); return; }
    if (!this.releveClient) return;
    this.isSavingPaiement = true;
    this.paiementError = '';
    this.clientService.addPaiement(this.releveClient.id, this.paiementForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: p => {
          this.isSavingPaiement = false;
          this.relevePaiements = [p, ...this.relevePaiements];
          this.showPaiementForm = false;
          // update local solde
          if (this.releveClient) {
            this.releveClient = { ...this.releveClient, soldeTotalDu: this.releveClient.soldeTotalDu - +p.montant };
          }
          this.load(); // refresh full list
        },
        error: err => {
          this.isSavingPaiement = false;
          this.paiementError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        }
      });
  }

  etatLabel(etat: string): string {
    const m: Record<string, string> = { EN_ATTENTE: 'En attente', PARTIEL: 'Partiel', PAYE: 'Payé' };
    return m[etat] ?? etat;
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  typeLabel(type: string): string {
    return this.CLIENT_TYPES.find(t => t.value === type)?.label ?? type;
  }

  formatNum(v: number | null | undefined): string {
    if (v == null) return '0.000';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
}
