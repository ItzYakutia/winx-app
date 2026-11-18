import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, defer, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, window.location.origin);
  const publicAuth = /^\/api\/v1\/(login|register|refresh|logout)\/?$/.test(url.pathname);
  if (
    url.origin !== window.location.origin ||
    !url.pathname.startsWith('/api/v1/') ||
    publicAuth ||
    req.headers.has('Authorization')
  )
    return next(req);
  const auth = inject(AuthService);
  return defer(() => {
    const session = auth.sessionId();
    return auth.accessForRequest().pipe(
      switchMap((token) => {
        auth.assertSession(session);
        const signed = token
          ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
          : req;
        return next(signed).pipe(
          tap(() => auth.assertSession(session)),
          catchError((error) => {
            auth.assertSession(session);
            if (!(error instanceof HttpErrorResponse && error.status === 401))
              return throwError(() => error);
            return auth.refreshSession(token).pipe(
              switchMap((access) => {
                auth.assertSession(session);
                return next(req.clone({ setHeaders: { Authorization: 'Bearer ' + access } })).pipe(
                  tap(() => auth.assertSession(session)),
                  catchError((retryError) => {
                    auth.assertSession(session);
                    if (retryError instanceof HttpErrorResponse && retryError.status === 401)
                      auth.expireSession(session);
                    return throwError(() => retryError);
                  }),
                );
              }),
            );
          }),
        );
      }),
    );
  });
};
