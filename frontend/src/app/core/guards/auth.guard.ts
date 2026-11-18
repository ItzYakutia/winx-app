import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { safeReturnUrl } from '../services/auth-session';
import { ModeService } from '../services/mode.service';

export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  auth.sessionId();
  return (
    auth.isLoggedIn() ||
    router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturnUrl(state.url) } })
  );
};

export const guestGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const mode = inject(ModeService);
  auth.sessionId();
  return (
    !auth.isLoggedIn() ||
    router.parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')) || mode.home())
  );
};
