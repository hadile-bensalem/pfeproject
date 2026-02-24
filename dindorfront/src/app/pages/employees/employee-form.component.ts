import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Employee, ContractType, Department, EmployeeStatus } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  form!: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  isEditMode = false;
  employeeId: number | null = null;

  typeContratOptions: ContractType[] = ['CDI', 'CDD', 'JOURNALIER', 'HORAIRE'];
  departementOptions: Department[] = ['VENTE', 'STOCK', 'LIVRAISON'];
  statutOptions: EmployeeStatus[] = ['ACTIF', 'SUSPENDU', 'QUITTÉ'];
  situationFamilialeOptions = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.employeeId = +id;
      this.loadEmployee(+id);
    }
    this.initForm();
  }

  private generateMatricule(): string {
    // Génère une matricule unique simple qui commence par 22SD suivi de 3 chiffres (ex: 22SD001, 22SD123)
    const now = new Date();
    // Utilise les 3 derniers chiffres du timestamp pour garantir l'unicité
    const timestamp = now.getTime();
    const troisChiffres = (timestamp % 1000).toString().padStart(3, '0');
    return `22SD${troisChiffres}`;
  }

  private initForm(): void {
    // Générer automatiquement le matricule si on est en mode création
    const matriculeValue = this.isEditMode ? '' : this.generateMatricule();

    this.form = this.fb.group({
      // Étape 1 - Informations personnelles
      matricule: [matriculeValue, [Validators.required, Validators.pattern(/^[A-Z0-9]{4,10}$/)]],
      nom: ['', [Validators.required, Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.maxLength(50)]],
      cin: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,12}$/)]],
      telephone: ['', [Validators.pattern(/^[0-9+\s]{8,15}$/)]],
      email: ['', [Validators.email]],
      adresse: [''],
      dateNaissance: ['', Validators.required],
      situationFamiliale: [''],
      nombreEnfants: [0, [Validators.min(0), Validators.max(20)]],

      // Étape 2 - Informations professionnelles
      poste: ['', Validators.required],
      departement: ['', Validators.required],
      typeContrat: ['CDI', Validators.required],
      dateRecrutement: ['', Validators.required],
      statut: ['ACTIF', Validators.required],

      // Étape 3 - Rémunération (dynamique selon typeContrat)
      // Mensuel
      salaireBase: [0, [Validators.min(0)]],
      primesFixes: [0, [Validators.min(0)]],
      primeRendement: [0, [Validators.min(0)]],
      // Journalier
      tarifJournalier: [0, [Validators.min(0)]],
      joursTravail: [0, [Validators.min(0)]],
      // Horaire
      tarifHoraire: [0, [Validators.min(0)]],
      heuresNormales: [0, [Validators.min(0)]],
      heuresSupplementaires: [0, [Validators.min(0)]]
    });

    // Écouter les changements de typeContrat pour afficher les bons champs
    this.form.get('typeContrat')?.valueChanges.subscribe(() => {
      this.updateRemunerationValidators();
    });
  }

  private updateRemunerationValidators(): void {
    const typeContrat = this.form.get('typeContrat')?.value;
    const salaireBase = this.form.get('salaireBase');
    const tarifJournalier = this.form.get('tarifJournalier');
    const tarifHoraire = this.form.get('tarifHoraire');

    // Réinitialiser les validators
    salaireBase?.clearValidators();
    tarifJournalier?.clearValidators();
    tarifHoraire?.clearValidators();

    if (typeContrat === 'CDI' || typeContrat === 'CDD') {
      salaireBase?.setValidators([Validators.required, Validators.min(0)]);
    } else if (typeContrat === 'JOURNALIER') {
      tarifJournalier?.setValidators([Validators.required, Validators.min(0)]);
    } else if (typeContrat === 'HORAIRE') {
      tarifHoraire?.setValidators([Validators.required, Validators.min(0)]);
    }

    salaireBase?.updateValueAndValidity();
    tarifJournalier?.updateValueAndValidity();
    tarifHoraire?.updateValueAndValidity();
  }

  private loadEmployee(id: number): void {
    this.employeeService.getById(id).subscribe({
      next: (employee) => {
        this.form.patchValue({
          ...employee,
          dateNaissance: employee.dateNaissance ? new Date(employee.dateNaissance).toISOString().substring(0, 10) : '',
          dateRecrutement: employee.dateRecrutement ? new Date(employee.dateRecrutement).toISOString().substring(0, 10) : ''
        });
        this.updateRemunerationValidators();
      },
      error: () => {
        alert('Erreur lors du chargement de l\'employé');
        this.router.navigate(['/employees']);
      }
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Valider l'étape actuelle
      const stepFields = this.getStepFields(this.currentStep);
      const stepForm = this.fb.group({});
      stepFields.forEach(field => {
        stepForm.addControl(field, this.form.get(field)!);
      });
      stepForm.markAllAsTouched();

      if (stepForm.valid) {
        this.currentStep++;
      } else {
        alert('Veuillez remplir tous les champs obligatoires de cette étape');
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private getStepFields(step: number): string[] {
    if (step === 1) {
      return ['matricule', 'nom', 'prenom', 'cin', 'dateNaissance'];
    } else if (step === 2) {
      return ['poste', 'departement', 'typeContrat', 'dateRecrutement', 'statut'];
    } else {
      const typeContrat = this.form.get('typeContrat')?.value;
      if (typeContrat === 'CDI' || typeContrat === 'CDD') {
        return ['salaireBase'];
      } else if (typeContrat === 'JOURNALIER') {
        return ['tarifJournalier'];
      } else if (typeContrat === 'HORAIRE') {
        return ['tarifHoraire'];
      }
      return [];
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Veuillez corriger les erreurs du formulaire');
      return;
    }

    const raw = this.form.value;
    const payload: Partial<Employee> = {
      ...raw,
      dateNaissance: raw.dateNaissance ? new Date(raw.dateNaissance).toISOString().substring(0, 10) : '',
      dateRecrutement: raw.dateRecrutement ? new Date(raw.dateRecrutement).toISOString().substring(0, 10) : ''
    };

    const request$ = this.isEditMode && this.employeeId
      ? this.employeeService.update(this.employeeId, payload)
      : this.employeeService.create(payload);

    request$.subscribe({
      next: () => {
        alert(this.isEditMode ? 'Employé mis à jour avec succès' : 'Employé créé avec succès');
        this.router.navigate(['/employees']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement de l\'employé :', error);
        let message = 'Erreur lors de l\'enregistrement de l\'employé';
        if (error?.error?.message) {
          message = error.error.message;
        }
        alert(message);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/employees']);
  }

  get isMensuel(): boolean {
    const type = this.form.get('typeContrat')?.value;
    return type === 'CDI' || type === 'CDD';
  }

  get isJournalier(): boolean {
    return this.form.get('typeContrat')?.value === 'JOURNALIER';
  }

  get isHoraire(): boolean {
    return this.form.get('typeContrat')?.value === 'HORAIRE';
  }
}
