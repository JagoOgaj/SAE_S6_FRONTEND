import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthApi } from '../constants/api-endpoints/api.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly http = inject(HttpClient);

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  setAccesToken(accessToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  logout(): Observable<any> {
    return forkJoin({
      access: this.revokeAccessToken().pipe(
        catchError((err) => {
          return of(null);
        }),
      ),
      refresh: this.revokeRefreshToken().pipe(
        catchError((err) => {
          return of(null);
        }),
      ),
    });
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });

    return this.http
      .post(
        `${AuthApi.BASE_URL}${AuthApi.ENDPOINT.REFERSH_TOKEN}`,
        {},
        { headers },
      )
      .pipe(
        tap((response: any) => {
          if (response && response.access_token) {
            this.setTokens(response.access_token, refreshToken);
          }
        }),
        catchError((error) => {
          this.logout();
          return of(null);
        }),
      );
  }

  revokeAccessToken(): Observable<any> {
    const token = this.getToken();

    if (!token) {
      return of(null);
    }

    return this.http
      .delete(`${AuthApi.BASE_URL}${AuthApi.ENDPOINT.REVOKE_ACCESS_TOKEN}`, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(
        tap(() => {
          this.clearTokens();
        }),
        catchError((error) => {
          this.clearTokens();
          return of(null);
        }),
      );
  }

  revokeRefreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    return this.http
      .delete(`${AuthApi.BASE_URL}${AuthApi.ENDPOINT.REVOKE_REFRESH_TOKEN}`, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        }),
      })
      .pipe(
        tap(() => {
          this.clearTokens();
        }),
        catchError((error) => {
          this.clearTokens();
          return of(null);
        }),
      );
  }
}
