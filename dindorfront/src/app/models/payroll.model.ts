export interface Payroll {
  id: number;
  employeeId: number;
  mois: number;   // 1-12
  annee: number;
  salaireBrut: number;
  primes: number;
  heuresSupplementaires: number;
  deductions: number;
  avantages: number;
  salaireNet: number;
  dateGeneration?: string;
}

