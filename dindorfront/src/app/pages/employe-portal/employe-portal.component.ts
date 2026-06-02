import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EmployeService } from '../../services/employe.service';
import { AuthService } from '../../services/auth.service';
import { Employee, FichePaie } from '../../models/employee.model';

const MOIS_LABELS = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

@Component({
  selector: 'app-employe-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employe-portal.component.html',
  styleUrl: './employe-portal.component.css'
})
export class EmployePortalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profil: Employee | null = null;
  fiches: FichePaie[] = [];
  isLoading = true;
  loadError = false;

  ficheSelectionnee: FichePaie | null = null;
  showBulletin = false;

  constructor(
    private employeService: EmployeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadError = false;
    this.employeService.getProfil().pipe(takeUntil(this.destroy$)).subscribe({
      next: p => { this.profil = p; this.loadFiches(); },
      error: () => { this.isLoading = false; this.loadError = true; }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private loadFiches(): void {
    this.employeService.getMesFiches().pipe(takeUntil(this.destroy$)).subscribe({
      next: list => { this.fiches = list; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  ouvrirBulletin(f: FichePaie): void { this.ficheSelectionnee = f; this.showBulletin = true; }
  fermerBulletin(): void { this.showBulletin = false; this.ficheSelectionnee = null; }
  fermerBulletinOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.fermerBulletin(); }
  imprimerBulletin(): void { window.print(); }

  reload(): void { this.ngOnInit(); }

  logout(): void { this.authService.logout(); }

  moisLabel(m: number): string { return MOIS_LABELS[m] ?? ''; }

  formatNum(v: number | null | undefined, dec = 3): string {
    if (v == null) return '0.000';
    return (+v).toLocaleString('fr-TN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = { BROUILLON: 'Brouillon', VALIDE: 'Validé', PAYE: 'Payé' };
    return m[s] ?? s;
  }

  initials(nom?: string, prenom?: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  get dernierBulletin(): FichePaie | null { return this.fiches[0] ?? null; }
}
