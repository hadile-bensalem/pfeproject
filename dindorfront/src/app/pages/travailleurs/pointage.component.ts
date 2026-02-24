import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Pointage } from '../../models/pointage.model';
import { PointageService } from '../../services/pointage.service';

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './pointage.component.html',
  styleUrl: './pointage.component.css'
})
export class PointageComponent implements OnInit {
  form!: FormGroup;
  travailleurId!: number;
  displayedColumns = ['datePointage', 'heuresTravaillees', 'rendementJour', 'observations'];
  historique: Pointage[] = [];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private pointageService: PointageService
  ) {}

  ngOnInit(): void {
    this.travailleurId = Number(this.route.snapshot.paramMap.get('id'));

    this.form = this.fb.group({
      datePointage: [new Date(), [Validators.required, this.sundayForbiddenValidator]],
      heuresTravaillees: [9, [Validators.required, Validators.min(0), Validators.max(24)]],
      rendementJour: [1.0, [Validators.required, Validators.min(0.5), Validators.max(2.0)]],
      observations: ['']
    });

    this.loadHistorique();
  }

  sundayForbiddenValidator(control: any) {
    const value = control.value as Date | null;
    if (value && value.getDay() === 0) { // 0 = dimanche
      return { sundayForbidden: true };
    }
    return null;
  }

  loadHistorique(): void {
    this.pointageService.getHistorique(this.travailleurId).subscribe({
      next: (data) => {
        this.historique = data ?? [];
      },
      error: () => {
        console.error('Erreur lors du chargement du pointage');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload = {
      datePointage: (raw.datePointage as Date).toISOString().substring(0, 10),
      heuresTravaillees: raw.heuresTravaillees,
      rendementJour: raw.rendementJour,
      observations: raw.observations
    };

    this.pointageService.create(this.travailleurId, payload).subscribe({
      next: () => {
        alert('Pointage enregistré avec succès');
        this.loadHistorique();
      },
      error: () => {
        alert('Erreur lors de l\'enregistrement du pointage');
      }
    });
  }

  dateFilter = (d: Date | null): boolean => {
    const date = d || new Date();
    // Désactiver le dimanche
    return date.getDay() !== 0;
  };
}

