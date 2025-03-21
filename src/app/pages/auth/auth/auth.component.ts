import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../../core/auth-token.service';
import { AuthService } from './auth.service';
import { error } from 'console';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  loginForm: FormGroup;
  inscriptionForm: FormGroup;
  isLoginMode: boolean = true;
  isPasswordVisible: boolean = false;
  isFadingIn: boolean = true;
  isFadingOut: boolean = false;
  showTooltip: boolean = false;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  passwordRequirements = {
    hasLength: false,
    hasUppercase: false,
    hasSpecialChar: false,
    hasNumber: false,
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authToken: AuthTokenService,
    private authService: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.inscriptionForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.inscriptionForm.get('password')?.valueChanges.subscribe((value) => {
      this.validatePassword(value);
    });
  }

  validatePassword(password: string): void {
    this.passwordRequirements.hasLength = password.length >= 8;
    this.passwordRequirements.hasUppercase = /[A-Z]/.test(password);
    this.passwordRequirements.hasSpecialChar = /[+*/\-!#$%^&*]/.test(password);
    this.passwordRequirements.hasNumber = /\d/.test(password);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleMode(): void {
    this.inscriptionForm.reset();
    this.loginForm.reset();
    this.errorMessage = null;
    this.isFadingOut = true;
    this.isFadingIn = false;
    setTimeout(() => {
      this.isLoginMode = !this.isLoginMode;
      this.isFadingOut = false;
      this.isFadingIn = true;
    }, 400);
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService
      .loginUser({
        email: email,
        password: password,
      })
      .subscribe({
        next: (response) => {
          this.authToken.setTokens(
            response.access_token,
            response.refresh_token,
          );
          this.isLoading = false;
          this.redirectTo('prompt');
        },
        error: (errors) => {
          this.errorMessage = errors.error.message;
          this.isLoading = false;
        },
      });
  }

  onInscriptionSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const { email, username, password } = this.inscriptionForm.value;
    this.authService
      .registryUser({
        email: email,
        username: username,
        password: password,
      })
      .subscribe({
        next: (response) => {
          this.authToken.setTokens(
            response.access_token,
            response.refresh_token,
          );
          this.isLoading = false;
          this.redirectTo('prompt');
        },
        error: (errors) => {
          this.errorMessage = errors.error.message;
          this.isLoading = false;
        },
      });
  }

  redirectTo(path: string): void {
    this.router.navigate([`${path}`]);
  }
}
