import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  async canActivate(
    route?: ActivatedRouteSnapshot,
    state?: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    try {
      const isLoggedIn = await this.authService.isLoggedInAsync();

      if (isLoggedIn) {

        return true;
      }

      return this.router.createUrlTree(['/auth/sign-in'], {
        queryParams: { returnUrl: state?.url || '/' },
      });
    } catch (error) {
      console.error('❌ Auth guard error:', error);
      return this.router.createUrlTree(['/auth/sign-in']);
    }
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }
}
