import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  forgotPasswordForm: FormGroup;
  isLoading: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
      
      const email = this.forgotPasswordForm.value.email;

      this.authService.requestPasswordReset(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = response.message || 'Un email de réinitialisation a été envoyé à votre adresse.';
          } else {
            this.errorMessage = response.message || 'Erreur lors de l\'envoi de l\'email';
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 404) {
            this.errorMessage = 'Aucun compte trouvé avec cet email.';
          } else {
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
          }
        }
      });
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
