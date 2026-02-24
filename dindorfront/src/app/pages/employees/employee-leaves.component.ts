import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Leave, LeaveType } from '../../models/leave.model';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-leaves',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-leaves.component.html',
  styleUrl: './employee-leaves.component.css'
})
export class EmployeeLeavesComponent implements OnInit {
  form!: FormGroup;
  employeeId: number | null = null;
  employee: Employee | null = null;
  leaves: Leave[] = [];
  isLoading = false;

  leaveTypes: LeaveType[] = ['CONGE_PAYE', 'MALADIE', 'ABSENCE_NON_JUSTIFIEE'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.queryParams['employeeId']);
    if (this.employeeId) {
      this.loadEmployee();
      this.loadLeaves();
    }
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      type: ['CONGE_PAYE', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      impactPaie: [true],
      commentaire: ['']
    });
  }

  private loadEmployee(): void {
    if (!this.employeeId) return;
    this.employeeService.getById(this.employeeId).subscribe({
      next: (data) => {
        this.employee = data;
      }
    });
  }

  private loadLeaves(): void {
    if (!this.employeeId) return;
    this.isLoading = true;
    this.leaveService.getByEmployee(this.employeeId).subscribe({
      next: (data) => {
        this.leaves = data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  calculateJours(dateDebut: string, dateFin: string): number {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.employeeId) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const jours = this.calculateJours(raw.dateDebut, raw.dateFin);

    const payload: Partial<Leave> = {
      type: raw.type,
      dateDebut: raw.dateDebut,
      dateFin: raw.dateFin,
      jours,
      impactPaie: raw.impactPaie
    };

    this.leaveService.create(this.employeeId, payload).subscribe({
      next: () => {
        alert('Congé enregistré avec succès');
        this.loadLeaves();
        this.form.reset();
        this.initForm();
      },
      error: () => {
        alert('Erreur lors de l\'enregistrement du congé');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  get totalJoursPris(): number {
    return this.leaves
      .filter(l => l.type === 'CONGE_PAYE')
      .reduce((sum, l) => sum + (l.jours || 0), 0);
  }
}
