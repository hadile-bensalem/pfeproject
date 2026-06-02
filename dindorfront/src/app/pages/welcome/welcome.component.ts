import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {

  // ── Navigation ──────────────────────────────────────────────────────────
  navScrolled    = false;
  mobileMenuOpen = false;
  activeSection  = 'hero';


  // ── Contact ──────────────────────────────────────────────────────────────
  contactForm    = { nom: '', email: '', message: '' };
  contactLoading = false;
  contactSuccess = false;
  contactError   = '';

  sendContact(): void {
    this.contactError = '';
    if (!this.contactForm.nom || !this.contactForm.email || !this.contactForm.message) {
      this.contactError = 'Veuillez remplir tous les champs.';
      return;
    }
    this.contactLoading = true;
    this.http.post<any>(`${environment.apiUrl}/public/contact`, this.contactForm).subscribe({
      next: () => {
        this.contactLoading = false;
        this.contactSuccess = true;
        this.contactForm    = { nom: '', email: '', message: '' };
        setTimeout(() => this.contactSuccess = false, 6000);
      },
      error: (err) => {
        this.contactLoading = false;
        this.contactError   = err?.error?.message || 'Une erreur est survenue. Réessayez.';
      }
    });
  }

  // ── Inscription modal ────────────────────────────────────────────────────
  showInscription  = false;
  inscriptionStep  = 1;   // 1 = form, 2 = success
  inscriptionLoading = false;
  inscriptionError   = '';
  form = {
    nom: '', email: '', telephone: '',
    adresse: '', password: '', confirmPassword: ''
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void { }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 40;
    for (const id of ['hero', 'about', 'contact']) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom > 120) {
          this.activeSection = id;
          break;
        }
      }
    }
  }

  // ── Inscription ──────────────────────────────────────────────────────────
  openInscription(): void {
    this.form = { nom: '', email: '', telephone: '', adresse: '', password: '', confirmPassword: '' };
    this.inscriptionError   = '';
    this.inscriptionStep    = 1;
    this.showInscription    = true;
  }

  closeInscription(): void { this.showInscription = false; }

  submitInscription(): void {
    if (!this.form.nom || !this.form.email || !this.form.password) {
      this.inscriptionError = 'Veuillez remplir tous les champs obligatoires.'; return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.inscriptionError = 'Les mots de passe ne correspondent pas.'; return;
    }
    if (this.form.password.length < 6) {
      this.inscriptionError = 'Le mot de passe doit contenir au moins 6 caractères.'; return;
    }
    this.inscriptionLoading = true;
    this.inscriptionError   = '';
    this.http.post<any>(`${environment.apiUrl}/public/inscription`, {
      nom:       this.form.nom,
      email:     this.form.email,
      telephone: this.form.telephone,
      adresse:   this.form.adresse,
      password:  this.form.password
    }).subscribe({
      next: () => { this.inscriptionLoading = false; this.inscriptionStep = 2; },
      error: (err) => {
        this.inscriptionLoading = false;
        this.inscriptionError   = err?.error?.message || 'Une erreur est survenue. Réessayez.';
      }
    });
  }

  navigateToLogin(): void  { this.router.navigate(['/login']);  }
  navigateToSignin(): void { this.router.navigate(['/signin']); }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen = false;
  }

}
