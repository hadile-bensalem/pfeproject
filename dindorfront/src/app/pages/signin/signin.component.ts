import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  signinForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.signinForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+216\s[0-9]{2}\s[0-9]{3}\s[0-9]{3}$/)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  formatPhoneNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Si l'utilisateur tape sans le +216, on l'ajoute
    if (value.startsWith('216')) {
      value = value.substring(3); // Enlever le 216
    }
    
    // Limiter à 8 chiffres (après +216)
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    // Formater: +216 XX XXX XXX
    let formatted = '+216';
    if (value.length > 0) {
      formatted += ' ' + value.substring(0, 2);
    }
    if (value.length > 2) {
      formatted += ' ' + value.substring(2, 5);
    }
    if (value.length > 5) {
      formatted += ' ' + value.substring(5, 8);
    }
    
    this.signinForm.patchValue({ phone: formatted }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.signinForm.valid) {
      this.isLoading = true;
      // Simuler une inscription
      setTimeout(() => {
        this.isLoading = false;
        // Rediriger vers la page de login après inscription
        this.router.navigate(['/login']);
        console.log('Signin data:', this.signinForm.value);
      }, 1500);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.signinForm.controls).forEach(key => {
        this.signinForm.get(key)?.markAsTouched();
      });
    }
  }

}
