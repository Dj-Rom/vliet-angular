import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { UserStatusService } from '../services/user-status.service';
import { AlertService } from '../services/alert.service';

@Injectable({ providedIn: 'root' })
export class StatusGuard implements CanActivate, CanActivateChild {
  constructor(
    private userStatus: UserStatusService,
    private router: Router,
    private alert: AlertService,
  ) {}

  async canActivate(
    _route?: ActivatedRouteSnapshot,
    _state?: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    if (this.userStatus.isLoading()) {
      await this.waitForStatus(3000);
    }

    const approved = this.userStatus.isApproved();

    // null = offline/not loaded -> allow access
    if (approved === null || approved === true) {
      return true;
    }

    // status === false -> pending
    this.alert.show(
      'error',
      'Twoje konto jest weryfikowane. W ciagu 24h otrzymasz dostep do tej funkcji.',
    );
    return this.router.createUrlTree(['/app/waybill-new']);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }

  private waitForStatus(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (!this.userStatus.isLoading() || Date.now() - start > ms) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
}
