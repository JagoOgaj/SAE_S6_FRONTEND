import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PasswordForgotService } from './password-forgot.service';
import { error } from 'console';
import { AuthTokenService } from '../../../core/auth-token.service';

@Component({
  selector: 'app-password-forgot',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './password-forgot.component.html',
  styleUrls: ['./password-forgot.component.css'],
})
export class PasswordForgotComponent implements OnInit {
  emailFormGroup: FormGroup;
  passwordFormGroup: FormGroup;
  step: 'email' | 'confirmationpassword' | 'confirmationadresse' | 'password' =
    'email';
  isPasswordVisible: boolean = false;
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
    private route: ActivatedRoute,
    private router: Router,
    private passwordForgotService: PasswordForgotService,
    private auth_token: AuthTokenService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.emailFormGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordFormGroup = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.passwordFormGroup.get('password')?.valueChanges.subscribe((value) => {
      this.validatePassword(value);
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe((params) => {
        const token = params['token'];
        if (token) {
          this.auth_token.clearTokens();
          this.auth_token.setAccesToken(token);
          this.passwordForgotService.checkIsTokenResetPassword().subscribe({
            next: (response) => {
              if (response.status == 'success') {
                this.step = 'password';
              }
            },
            error: (errors) => {
              this.auth_token.clearTokens();
              this.router.navigate([], {
                queryParams: {},
                replaceUrl: true,
              });
            },
          });
        }
      });
    }
  }
  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  validatePassword(password: string | null): void {
    if (!password) return;

    this.passwordRequirements.hasLength = password.length >= 8;
    this.passwordRequirements.hasUppercase = /[A-Z]/.test(password);
    this.passwordRequirements.hasSpecialChar = /[+*/\-!#$%^&*]/.test(password);
    this.passwordRequirements.hasNumber = /\d/.test(password);
  }

  submitEmail(): void {
    if (this.emailFormGroup.invalid) {
      this.emailFormGroup.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const { email } = this.emailFormGroup.value;
    this.passwordForgotService
      .sendRequestResetPwd({
        email: email,
      })
      .subscribe({
        next: (response) => {
          if (response.status == 'success') {
            this.isLoading = false;
            this.emailFormGroup.reset();
            this.step = 'confirmationadresse';
          }
        },
        error: (errors) => {
          this.isLoading = false;
          this.errorMessage = errors.error.message;
        },
      });
  }

  submitPassword(): void {
    if (this.passwordFormGroup.invalid) {
      this.emailFormGroup.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const { password } = this.passwordFormGroup.value;
    this.passwordForgotService
      .resetPassword({
        password: password,
      })
      .subscribe({
        next: (response) => {
          if (response.status == 'success') {
            this.isLoading = false;
            this.passwordFormGroup.reset();
            this.auth_token.clearTokens();
            this.step = 'confirmationpassword';
          }
        },
        error: (errors) => {
          this.isLoading = false;
          this.auth_token.clearTokens();
          this.errorMessage = errors.error.message;
        },
      });
  }

  redirectTo(path: string) {
    this.router.navigate([`${path}`]);
  }
}
