import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthApi } from '../../../constants/api-endpoints/api.constants';

@Injectable({
  providedIn: 'root',
})
export class PasswordForgotService {
  private readonly http = inject(HttpClient);

  sendRequestResetPwd(data: any): Observable<any> {
    return this.http
      .post<any>(
        `${AuthApi.BASE_URL}${AuthApi.ENDPOINT.REQUEST_RESET_PASSWORD}`,
        data,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        },
      )
      .pipe(
        catchError((errors) => {
          return throwError(() => errors);
        }),
      );
  }

  resetPassword(data: any): Observable<any> {
    return this.http
      .post<any>(
        `${AuthApi.BASE_URL}${AuthApi.ENDPOINT.RESET_PASSWORD}`,
        data,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        },
      )
      .pipe(
        catchError((errors) => {
          return throwError(() => errors);
        }),
      );
  }

  checkIsTokenResetPassword(): Observable<any> {
    return this.http
      .get<any>(
        `${AuthApi.BASE_URL}${AuthApi.ENDPOINT.CHECK_RESET_PASSWORD_TOKEN}`,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        },
      )
      .pipe(
        catchError((errors) => {
          return throwError(() => errors);
        }),
      );
  }
}
