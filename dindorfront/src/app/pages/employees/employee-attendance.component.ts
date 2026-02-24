import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Attendance } from '../../models/attendance.model';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-attendance.component.html',
  styleUrl: './employee-attendance.component.css'
})
export class EmployeeAttendanceComponent implements OnInit {
  form!: FormGroup;
  employeeId: number | null = null;
  employee: Employee | null = null;
  attendances: Attendance[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.queryParams['employeeId']);
    if (this.employeeId) {
      this.loadEmployee();
      this.loadAttendances();
    }
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      heureEntree: ['08:00', Validators.required],
      heureSortie: ['17:00', Validators.required],
      mode: ['MANUEL', Validators.required]
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

  private loadAttendances(): void {
    if (!this.employeeId) return;
    this.isLoading = true;
    this.attendanceService.getByEmployee(this.employeeId).subscribe({
      next: (data) => {
        this.attendances = data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  calculateHeures(entree: string, sortie: string): number {
    const [h1, m1] = entree.split(':').map(Number);
    const [h2, m2] = sortie.split(':').map(Number);
    const start = h1 * 60 + m1;
    const end = h2 * 60 + m2;
    return Math.max(0, (end - start) / 60);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.employeeId) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const heuresTravaillees = this.calculateHeures(raw.heureEntree, raw.heureSortie);

    const payload: Partial<Attendance> = {
      date: raw.date,
      heureEntree: raw.heureEntree,
      heureSortie: raw.heureSortie,
      heuresTravaillees,
      mode: raw.mode
    };

    this.attendanceService.create(this.employeeId, payload).subscribe({
      next: () => {
        alert('Pointage enregistré avec succès');
        this.loadAttendances();
        this.form.reset();
        this.initForm();
      },
      error: () => {
        alert('Erreur lors de l\'enregistrement du pointage');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  get totalHeuresMois(): number {
    return this.attendances.reduce((sum, a) => sum + (a.heuresTravaillees || 0), 0);
  }
}
