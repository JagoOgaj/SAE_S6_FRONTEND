import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthApi } from '../../../constants/api-endpoints/api.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  loginUser(data: any): Observable<any> {
    return this.http
      .post<any>(`${AuthApi.BASE_URL}${AuthApi.ENDPOINT.LOGIN}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        catchError((errors) => {
          return throwError(() => errors);
        }),
      );
  }

  registryUser(data: any): Observable<any> {
    return this.http
      .post<any>(`${AuthApi.BASE_URL}${AuthApi.ENDPOINT.REGISTRY}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        catchError((errors) => {
          return throwError(() => errors);
        }),
      );
  }
}
