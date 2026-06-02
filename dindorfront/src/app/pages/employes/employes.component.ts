import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeService } from '../../services/employe.service';
import { Employee, FichePaie } from '../../models/employee.model';

const MOIS_LABELS = ['', 'Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './employes.component.html',
  styleUrl: './employes.component.css'
})
export class EmployesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Liste ──────────────────────────────────────────────────────────────
  employes: Employee[]  = [];
  filtered: Employee[]  = [];
  isLoading  = true;
  searchTerm = '';
  filterStatut = '';

  // ── Modal employé ──────────────────────────────────────────────────────
  showModal  = false;
  isEditing  = false;
  editingId  = 0;
  isSaving   = false;
  formError  = '';
  empForm!: FormGroup;

  // ── Panneau détail employé ─────────────────────────────────────────────
  selectedEmp: Employee | null = null;
  fiches: FichePaie[] = [];
  isLoadingFiches = false;
  activeTab: 'infos' | 'paie' = 'infos';

  // ── Modal fiche de paie ────────────────────────────────────────────────
  showFicheModal = false;
  isSavingFiche  = false;
  ficheError     = '';
  ficheForm!: FormGroup;
  ficheSelectionnee: FichePaie | null = null;
  showBulletin = false;

  readonly TYPES_CONTRAT = ['CDI', 'CDD', 'JOURNALIER', 'HORAIRE'];
  readonly DEPARTEMENTS  = ['ADMINISTRATION', 'VENTE', 'STOCK', 'LIVRAISON', 'PRODUCTION'];
  readonly SITUATIONS    = ['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF'];
  readonly STATUTS_EMP   = ['ACTIF', 'SUSPENDU', 'QUITTE'];
  readonly ANNEES        = Array.from({length: 6}, (_, i) => new Date().getFullYear() - i);
  readonly MOIS          = MOIS_LABELS.slice(1).map((l, i) => ({ val: i + 1, label: l }));

  constructor(private fb: FormBuilder, private employeService: EmployeService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ────────────────────────────────────────────────────────

  load(): void {
    this.isLoading = true;
    this.employeService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.employes = list; this.applyFilter(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    let list = this.employes;
    if (this.filterStatut) list = list.filter(e => e.statut === this.filterStatut);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        (e.matricule ?? '').toLowerCase().includes(q) ||
        (e.poste ?? '').toLowerCase().includes(q)
      );
    }
    this.filtered = list;
  }

  // ── Sélection employé ─────────────────────────────────────────────────

  selectEmp(emp: Employee): void {
    this.selectedEmp = emp;
    this.activeTab = 'infos';
    this.ficheSelectionnee = null;
    this.showBulletin = false;
    this.loadFiches(emp.id);
  }

  loadFiches(empId: number): void {
    this.isLoadingFiches = true;
    this.fiches = [];
    this.employeService.getFichesByEmployee(empId).pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.fiches = list; this.isLoadingFiches = false; },
      error: () => { this.isLoadingFiches = false; }
    });
  }

  // ── Modal Employé ─────────────────────────────────────────────────────

  openCreate(): void {
    this.isEditing = false; this.editingId = 0; this.formError = '';
    this.empForm = this.buildEmpForm();
    this.showModal = true;
  }

  openEdit(emp: Employee): void {
    this.isEditing = true; this.editingId = emp.id; this.formError = '';
    this.empForm = this.buildEmpForm(emp);
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.formError = ''; }
  closeModalOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.closeModal(); }

  closeFicheModalOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.closeFicheModal(); }
  closeBulletinOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.fermerBulletin(); }

  private buildEmpForm(e?: Employee): FormGroup {
    return this.fb.group({
      nom:               [e?.nom ?? '',        Validators.required],
      prenom:            [e?.prenom ?? '',     Validators.required],
      cin:               [e?.cin ?? ''],
      email:             [e?.email ?? '',      Validators.email],
      motDePasse:        [''],
      telephone:         [e?.telephone ?? ''],
      adresse:           [e?.adresse ?? ''],
      dateNaissance:     [e?.dateNaissance ?? ''],
      situationFamiliale:[e?.situationFamiliale ?? 'CELIBATAIRE'],
      nombreEnfants:     [e?.nombreEnfants ?? 0],
      poste:             [e?.poste ?? '',      Validators.required],
      departement:       [e?.departement ?? ''],
      typeContrat:       [e?.typeContrat ?? 'CDI'],
      dateRecrutement:   [e?.dateRecrutement ?? ''],
      statut:            [e?.statut ?? 'ACTIF'],
      actif:             [e?.actif ?? true],
      salaireBase:       [e?.salaireBase ?? 0, [Validators.required, Validators.min(0)]],
      primesFixes:       [e?.primesFixes ?? 0],
      primeRendement:    [e?.primeRendement ?? 0],
      tarifHoraire:      [e?.tarifHoraire ?? 0],
      heuresNormalesMois:[e?.heuresNormalesMois ?? 208],
      affilieCNSS:       [e?.affilieCNSS ?? true],
      numeroCNSS:        [e?.numeroCNSS ?? ''],
      rib:               [e?.rib ?? ''],
      notes:             [e?.notes ?? ''],
    });
  }

  submitEmp(): void {
    if (this.empForm.invalid) { this.empForm.markAllAsTouched(); return; }
    this.isSaving = true; this.formError = '';
    const v = this.empForm.value;
    const payload = { ...v };
    if (!payload.motDePasse) delete payload.motDePasse;

    const obs = this.isEditing
      ? this.employeService.update(this.editingId, payload)
      : this.employeService.create(payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; this.closeModal(); this.load(); },
      error: err => { this.isSaving = false; this.formError = err?.error?.message || 'Erreur lors de la sauvegarde.'; }
    });
  }

  deleteEmp(emp: Employee): void {
    if (!confirm(`Supprimer ${emp.prenom} ${emp.nom} ?`)) return;
    this.employeService.delete(emp.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { if (this.selectedEmp?.id === emp.id) this.selectedEmp = null; this.load(); },
      error: err => alert(err?.error?.message || 'Impossible de supprimer.')
    });
  }

  // ── Modal Fiche de paie ───────────────────────────────────────────────

  openFicheModal(): void {
    if (!this.selectedEmp) return;
    const now = new Date();
    this.ficheError = '';
    const tauxHS = this.selectedEmp.salaireBase && this.selectedEmp.heuresNormalesMois
      ? +(+(this.selectedEmp.salaireBase) / this.selectedEmp.heuresNormalesMois * 1.25).toFixed(3) : 0;

    this.ficheForm = this.fb.group({
      mois:                  [now.getMonth() + 1,                   [Validators.required, Validators.min(1), Validators.max(12)]],
      annee:                 [now.getFullYear(),                     Validators.required],
      salaireBase:           [this.selectedEmp.salaireBase ?? 0,    [Validators.required, Validators.min(0)]],
      primesFixes:           [this.selectedEmp.primesFixes ?? 0],
      primeRendement:        [0],
      indemnites:            [0],
      heuresSupplementaires: [0,                                     Validators.min(0)],
      tauxHoraireHS:         [tauxHS],
      avanceSalaire:         [0],
      autresRetenues:        [0],
      statut:                ['VALIDE'],
      datePaiement:          [''],
      notes:                 [''],
    });
    this.showFicheModal = true;
  }

  closeFicheModal(): void { this.showFicheModal = false; this.ficheError = ''; }

  submitFiche(): void {
    if (this.ficheForm.invalid || !this.selectedEmp) { this.ficheForm.markAllAsTouched(); return; }
    this.isSavingFiche = true; this.ficheError = '';
    const v = this.ficheForm.value;
    const payload = { ...v, employeId: this.selectedEmp.id };
    if (!payload.datePaiement) delete payload.datePaiement;

    this.employeService.genererFiche(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: fiche => {
        this.isSavingFiche = false;
        this.closeFicheModal();
        this.loadFiches(this.selectedEmp!.id);
        this.activeTab = 'paie';
        this.ficheSelectionnee = fiche;
        this.showBulletin = true;
      },
      error: err => { this.isSavingFiche = false; this.ficheError = err?.error?.message || 'Erreur lors de la génération.'; }
    });
  }

  ouvrirBulletin(f: FichePaie): void { this.ficheSelectionnee = f; this.showBulletin = true; }
  fermerBulletin(): void { this.showBulletin = false; this.ficheSelectionnee = null; }
  imprimerBulletin(): void { window.print(); }

  updateStatut(ficheId: number, statut: string): void {
    const datePaiement = statut === 'PAYE' ? new Date().toISOString().slice(0, 10) : undefined;
    this.employeService.updateStatutFiche(ficheId, statut, datePaiement)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.loadFiches(this.selectedEmp!.id),
        error: err => alert(err?.error?.message || 'Erreur.')
      });
  }

  deleteFiche(ficheId: number): void {
    if (!confirm('Supprimer cette fiche de paie ?')) return;
    this.employeService.deleteFiche(ficheId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { if (this.ficheSelectionnee?.id === ficheId) this.fermerBulletin(); this.loadFiches(this.selectedEmp!.id); },
      error: err => alert(err?.error?.message || 'Erreur.')
    });
  }

  // ── Calcul temps réel fiche ───────────────────────────────────────────

  get montantHS(): number {
    if (!this.ficheForm) return 0;
    const h = +this.ficheForm.get('heuresSupplementaires')!.value || 0;
    const t = +this.ficheForm.get('tauxHoraireHS')!.value || 0;
    return +(h * t).toFixed(3);
  }

  get brutPreview(): number {
    if (!this.ficheForm) return 0;
    const f = this.ficheForm.value;
    return +(+f.salaireBase + +f.primesFixes + +f.primeRendement + +f.indemnites + this.montantHS).toFixed(3);
  }

  get cnssEmployePreview(): number { return this.selectedEmp?.affilieCNSS ? +(this.brutPreview * 0.0918).toFixed(3) : 0; }
  get netPreview(): number { return +(this.brutPreview - this.cnssEmployePreview - (+this.ficheForm?.get('avanceSalaire')?.value || 0) - (+this.ficheForm?.get('autresRetenues')?.value || 0)).toFixed(3); }

  // ── Helpers ───────────────────────────────────────────────────────────

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

  moisLabel(m: number): string { return MOIS_LABELS[m] ?? ''; }

  statutLabel(s: string): string {
    const m: Record<string, string> = { BROUILLON: 'Brouillon', VALIDE: 'Validé', PAYE: 'Payé' };
    return m[s] ?? s;
  }

  statutEmpLabel(s: string): string {
    const m: Record<string, string> = { ACTIF: 'Actif', SUSPENDU: 'Suspendu', QUITTE: 'Quitté' };
    return m[s] ?? s;
  }

  contratLabel(t: string): string {
    const m: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', JOURNALIER: 'Journalier', HORAIRE: 'Horaire' };
    return m[t] ?? t;
  }

  initials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  get activeCount(): number { return this.employes.filter(e => e.actif).length; }
  get totalMasse(): number { return this.employes.filter(e => e.actif).reduce((s, e) => s + (+e.salaireBase || 0), 0); }
}
