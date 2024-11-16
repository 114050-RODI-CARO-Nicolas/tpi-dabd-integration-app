import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const user = sessionService.getItem('user');

  return of(user).pipe(
    map((u) => {
      if (!u) {
        return router.parseUrl('');
        // return router.parseUrl('/home');
      }
      return true;
    })
  );
};
