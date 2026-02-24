import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Travailleur } from '../../models/travailleur.model';
import { TravailleurService } from '../../services/travailleur.service';

@Component({
  selector: 'app-travailleur-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './travailleur-list.component.html',
  styleUrl: './travailleur-list.component.css'
})
export class TravailleurListComponent implements OnInit {
  displayedColumns: string[] = [
    'nom',
    'prenom',
    'cin',
    'typeTravailleur',
    'statutCNSS',
    'tarifJournalier',
    'rendement',
    'actif',
    'actions'
  ];

  travailleurs: Travailleur[] = [];
  filteredTravailleurs: Travailleur[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  // Modal / formulaire
  form!: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isViewOnly = false;
  currentId: number | null = null;

  constructor(
    private travailleurService: TravailleurService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTravailleurs();
  }

  private loadTravailleurs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.travailleurService.getAll().subscribe({
      next: (travailleurs) => {
        this.travailleurs = travailleurs ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement des travailleurs';
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.maxLength(50)]],
      cin: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,12}$/)]],
      adresse: ['', [Validators.maxLength(255)]],
      telephone: ['', [Validators.pattern(/^[0-9+\s]{8,15}$/)]],
      dateNaissance: [null],
      dateEmbauche: [null, [Validators.required]],
      typeTravailleur: ['PERMANENT', [Validators.required]],
      statutCNSS: [false],
      tarifJournalier: [0, [Validators.required, Validators.min(0)]],
      heuresTravailJour: [9, [Validators.required, Validators.min(1), Validators.max(12)]],
      rendement: [1.0, [Validators.required, Validators.min(0.5), Validators.max(2.0)]],
      observations: ['', [Validators.maxLength(1000)]],
      actif: [true]
    });
  }

  get salaireFinal(): number {
    const t = this.form.get('tarifJournalier')?.value || 0;
    const h = this.form.get('heuresTravailJour')?.value || 0;
    const r = this.form.get('rendement')?.value || 1;
    return t * h * r;
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredTravailleurs = [...this.travailleurs];
      return;
    }
    this.filteredTravailleurs = this.travailleurs.filter(t =>
      t.nom.toLowerCase().includes(term) ||
      t.prenom.toLowerCase().includes(term) ||
      t.cin.toLowerCase().includes(term) ||
      (t.typeTravailleur || '').toString().toLowerCase().includes(term) ||
      (t.statutCNSS ? 'cnss' : 'non cnss').includes(term) ||
      t.tarifJournalier.toString().includes(term)
    );
  }

  // Ouverture / fermeture du formulaire
  openCreate(): void {
    this.isEditing = false;
    this.isViewOnly = false;
    this.currentId = null;
    this.form.reset({
      nom: '',
      prenom: '',
      cin: '',
      adresse: '',
      telephone: '',
      dateNaissance: null,
      dateEmbauche: null,
      typeTravailleur: 'PERMANENT',
      statutCNSS: false,
      tarifJournalier: 0,
      heuresTravailJour: 9,
      rendement: 1.0,
      observations: '',
      actif: true
    });
    this.form.enable();
    this.isModalOpen = true;
  }

  openEdit(travailleur: Travailleur): void {
    this.isEditing = true;
    this.isViewOnly = false;
    this.currentId = travailleur.id;
    this.patchFormFromTravailleur(travailleur);
    this.form.enable();
    this.isModalOpen = true;
  }

  openView(travailleur: Travailleur): void {
    this.isEditing = false;
    this.isViewOnly = true;
    this.currentId = travailleur.id;
    this.patchFormFromTravailleur(travailleur);
    this.form.disable();
    this.isModalOpen = true;
  }

  private patchFormFromTravailleur(t: Travailleur): void {
    this.form.setValue({
      nom: t.nom,
      prenom: t.prenom,
      cin: t.cin,
      adresse: t.adresse,
      telephone: t.telephone,
      dateNaissance: t.dateNaissance ? new Date(t.dateNaissance) : null,
      dateEmbauche: t.dateEmbauche ? new Date(t.dateEmbauche) : null,
      typeTravailleur: t.typeTravailleur,
      statutCNSS: t.statutCNSS,
      tarifJournalier: t.tarifJournalier,
      heuresTravailJour: t.heuresTravailJour,
      rendement: t.rendement,
      observations: t.observations,
      actif: t.actif
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isViewOnly = false;
    this.isEditing = false;
    this.currentId = null;
  }

  onSubmitForm(): void {
    if (this.form.invalid || this.isViewOnly) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    
    // Helper pour convertir les dates
    const formatDate = (dateValue: any): string | undefined => {
      if (!dateValue) return undefined;
      if (typeof dateValue === 'string') return dateValue; // Déjà au format YYYY-MM-DD
      if (dateValue instanceof Date) return dateValue.toISOString().substring(0, 10);
      return undefined;
    };
    
    const payload: Partial<Travailleur> = {
      nom: raw.nom,
      prenom: raw.prenom,
      cin: raw.cin,
      adresse: raw.adresse || undefined,
      telephone: raw.telephone || undefined,
      dateNaissance: formatDate(raw.dateNaissance),
      dateEmbauche: formatDate(raw.dateEmbauche),
      typeTravailleur: raw.typeTravailleur,
      statutCNSS: raw.statutCNSS || false,
      tarifJournalier: raw.tarifJournalier,
      heuresTravailJour: raw.heuresTravailJour,
      rendement: raw.rendement,
      observations: raw.observations || undefined,
      actif: raw.actif !== undefined ? raw.actif : true
    };

    const request$ = this.currentId
      ? this.travailleurService.update(this.currentId, payload)
      : this.travailleurService.create(payload);

    request$.subscribe({
      next: () => {
        alert('Travailleur enregistré avec succès');
        this.closeModal();
        this.loadTravailleurs();
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        let errorMessage = 'Erreur lors de l\'enregistrement du travailleur';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.data && typeof error.error.data === 'object') {
          // Erreurs de validation
          const validationErrors = Object.values(error.error.data).join(', ');
          errorMessage = `Erreurs de validation: ${validationErrors}`;
        }
        alert(errorMessage);
      }
    });
  }

  supprimer(travailleur: Travailleur): void {
    if (!confirm(`Supprimer le travailleur ${travailleur.prenom} ${travailleur.nom} ?`)) {
      return;
    }

    this.travailleurService.delete(travailleur.id).subscribe({
      next: () => {
        alert('Travailleur supprimé avec succès');
        this.loadTravailleurs();
      },
      error: () => {
        alert('Erreur lors de la suppression du travailleur');
      }
    });
  }

  allerPointage(travailleur: Travailleur): void {
    this.router.navigate(['/travailleurs', travailleur.id, 'pointage']);
  }

  allerHome(): void {
    this.router.navigate(['/home']);
  }
}

