import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.css'
})
export class EmployeesListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.employeeService.getAll().subscribe({
      next: (data) => {
        this.employees = data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement des employés';
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredEmployees = this.employees.filter(e => {
      const matchesSearch =
        !term ||
        e.matricule.toLowerCase().includes(term) ||
        e.nom.toLowerCase().includes(term) ||
        e.prenom.toLowerCase().includes(term) ||
        (e.poste || '').toLowerCase().includes(term);
      return matchesSearch;
    });
  }

  getDisplayedBaseSalary(employee: Employee): number {
    // Pour les contrats journaliers, calculer Salaire de base = tarifJournalier * joursTravail
    if (employee.typeContrat === 'JOURNALIER') {
      const tarif = employee.tarifJournalier ?? 0;
      const jours = employee.joursTravail ?? 0;
      return tarif * jours;
    }

    // Pour CDI / CDD / HORAIRE, utiliser directement salaireBase si disponible
    return employee.salaireBase ?? 0;
  }

  goToAdd(): void {
    this.router.navigate(['/employees/add']);
  }

  goToEdit(employee: Employee): void {
    this.router.navigate(['/employees/edit', employee.id]);
  }

  goToDetails(employee: Employee): void {
    this.router.navigate(['/employees/details', employee.id]);
  }

  goToAttendance(employee: Employee): void {
    this.router.navigate(['/employees/attendance'], {
      queryParams: { employeeId: employee.id }
    });
  }

  goToPayroll(employee: Employee): void {
    this.router.navigate(['/employees/payroll'], {
      queryParams: { employeeId: employee.id }
    });
  }

  delete(employee: Employee): void {
    if (!confirm(`Supprimer l'employé ${employee.prenom} ${employee.nom} ?`)) {
      return;
    }
    this.employeeService.delete(employee.id).subscribe({
      next: () => {
        this.loadEmployees();
      },
      error: () => {
        alert('Erreur lors de la suppression de l\'employé');
      }
    });
  }
}

