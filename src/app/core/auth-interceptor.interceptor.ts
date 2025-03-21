import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthApi, ModelApi } from '../constants/api-endpoints/api.constants';
import { AuthTokenService } from './auth-token.service';
import { AppService } from '../app.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthTokenService,
    private appService: AppService,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const authToken = this.authService.getToken();
    const refreshToken = this.authService.getRefreshToken();

    const noNeedAccessToken = [
      AuthApi.ENDPOINT.REVOKE_REFRESH_TOKEN,
      AuthApi.ENDPOINT.REFERSH_TOKEN,
      AuthApi.ENDPOINT.REQUEST_RESET_PASSWORD,
      AuthApi.ENDPOINT.REGISTRY,
      AuthApi.ENDPOINT.LOGIN,
      ModelApi.ENDPOINT.PREDICT(''),
    ].some((endpoint) => req.url.includes(endpoint));

    const needRefreshToken = [
      AuthApi.ENDPOINT.REFERSH_TOKEN,
      AuthApi.ENDPOINT.REVOKE_REFRESH_TOKEN,
    ].some((endpoint) => req.url.includes(endpoint));

    let authReq = req;

    if (authToken && !noNeedAccessToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    }

    if (refreshToken && needRefreshToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (
          error.status === 401 &&
          (error.error?.msg === 'Token has expired' ||
            error.statusText === 'UNAUTHORIZED')
        ) {
          this.appService.setShowTokenExpiredAlert(true);
        }
        return throwError(error);
      }),
    );
  }
}
