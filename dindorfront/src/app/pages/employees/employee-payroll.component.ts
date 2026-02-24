import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Payroll } from '../../models/payroll.model';
import { PayrollService } from '../../services/payroll.service';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-payroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-payroll.component.html',
  styleUrl: './employee-payroll.component.css'
})
export class EmployeePayrollComponent implements OnInit {
  employeeId: number | null = null;
  employee: Employee | null = null;
  payrolls: Payroll[] = [];
  selectedPayroll: Payroll | null = null;
  isLoading = false;
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private payrollService: PayrollService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.queryParams['employeeId']);
    if (this.employeeId) {
      this.loadEmployee();
      this.loadPayrolls();
    }
  }

  private loadEmployee(): void {
    if (!this.employeeId) return;
    this.employeeService.getById(this.employeeId).subscribe({
      next: (data) => {
        this.employee = data;
      }
    });
  }

  private loadPayrolls(): void {
    if (!this.employeeId) return;
    this.isLoading = true;
    this.payrollService.getByEmployee(this.employeeId).subscribe({
      next: (data) => {
        this.payrolls = data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectPayroll(payroll: Payroll): void {
    this.selectedPayroll = payroll;
  }

  generatePayroll(): void {
    if (!this.employeeId) return;
    // Appel API pour générer la fiche de paie
    alert('Génération de la fiche de paie (fonctionnalité à implémenter avec le backend)');
  }

  downloadPDF(payroll: Payroll): void {
    // Fonctionnalité de téléchargement PDF
    alert('Téléchargement PDF (fonctionnalité à implémenter)');
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}
