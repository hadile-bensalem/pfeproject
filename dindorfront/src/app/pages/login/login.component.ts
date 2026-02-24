import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  loginForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      
      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe || false
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            // Rediriger vers la page home après connexion réussie
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = response.message || 'Erreur lors de la connexion';
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 401) {
            this.errorMessage = 'Email ou mot de passe incorrect';
          } else if (error.status === 423) {
            this.errorMessage = 'Votre compte est verrouillé. Réessayez plus tard.';
          } else {
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
          }
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
