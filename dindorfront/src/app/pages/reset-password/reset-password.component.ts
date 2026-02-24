import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  resetPasswordForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  token: string | null = null;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });

    // Récupérer le token depuis les paramètres de requête (?token=...)
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.errorMessage = 'Lien de réinitialisation invalide ou incomplet.';
      }
    });
  }

  private passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (!this.token) {
      this.errorMessage = 'Lien de réinitialisation invalide.';
      return;
    }

    if (this.resetPasswordForm.invalid) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const password = this.resetPasswordForm.value.password;
    const confirmPassword = this.resetPasswordForm.value.confirmPassword;

    this.authService.resetPassword(this.token, password, confirmPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message || 'Votre mot de passe a été réinitialisé avec succès.';
          // Redirection vers la page de login après quelques secondes
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la réinitialisation du mot de passe.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}

