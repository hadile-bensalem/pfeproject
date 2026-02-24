import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.css'
})
export class EmployeeDetailsComponent implements OnInit {
  employee: Employee | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(+id);
    }
  }

  private loadEmployee(id: number): void {
    this.isLoading = true;
    this.employeeService.getById(id).subscribe({
      next: (data) => {
        this.employee = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement de l\'employé';
      }
    });
  }

  goToEdit(): void {
    if (this.employee) {
      this.router.navigate(['/employees/edit', this.employee.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  goToAttendance(): void {
    if (this.employee) {
      this.router.navigate(['/employees/attendance'], {
        queryParams: { employeeId: this.employee.id }
      });
    }
  }

  goToLeaves(): void {
    if (this.employee) {
      this.router.navigate(['/employees/leaves'], {
        queryParams: { employeeId: this.employee.id }
      });
    }
  }

  goToPayroll(): void {
    if (this.employee) {
      this.router.navigate(['/employees/payroll'], {
        queryParams: { employeeId: this.employee.id }
      });
    }
  }

  get salaireFinal(): number {
    if (!this.employee) return 0;
    const type = this.employee.typeContrat;
    if (type === 'CDI' || type === 'CDD') {
      return (this.employee.salaireBase || 0) + (this.employee.primesFixes || 0) + (this.employee.primeRendement || 0);
    } else if (type === 'JOURNALIER') {
      return (this.employee.tarifJournalier || 0) * (this.employee.joursTravail || 0);
    } else if (type === 'HORAIRE') {
      const base = (this.employee.tarifHoraire || 0) * (this.employee.heuresNormales || 0);
      const supp = (this.employee.tarifHoraire || 0) * 1.5 * (this.employee.heuresSupplementaires || 0);
      return base + supp;
    }
    return 0;
  }
}
