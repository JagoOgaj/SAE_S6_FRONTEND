import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppService } from './app.service';
import { AuthTokenService } from './core/auth-token.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Sae_Angular_IA';
  isTokenExpired: boolean = false;
  isLoggingOut: boolean = false;
  private readonly router = inject(Router);

  constructor(
    private appStateService: AppService,
    private authTokenService: AuthTokenService,
  ) {}

  ngOnInit(): void {
    this.appStateService.tokenExpired$.subscribe((expired) => {
      this.isTokenExpired = expired;
    });
  }

  resetTokenExpiredStatus() {
    this.appStateService.setShowTokenExpiredAlert(false);
  }

  reconnect() {
    this.resetTokenExpiredStatus();
    this.router.navigate(['/auth']);
  }

  logout() {
    this.isLoggingOut = true;
    this.authTokenService.logout().subscribe({
      next: (response) => {
        this.resetTokenExpiredStatus();
        this.isLoggingOut = false;
        this.router.navigate(['']);
      },
      error: (errors) => {
        this.resetTokenExpiredStatus();
        this.authTokenService.clearTokens();
        this.isLoggingOut = false;
        this.router.navigate(['']);
      },
    });
  }
}
