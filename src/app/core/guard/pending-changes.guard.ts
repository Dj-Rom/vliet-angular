import { inject } from '@angular/core';
import { CanDeactivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, isObservable, firstValueFrom } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export interface CanComponentDeactivate {
  canDeactivate: (nextState?: RouterStateSnapshot) => boolean | Promise<boolean> | Observable<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<CanComponentDeactivate> = async (
  component: CanComponentDeactivate,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot,
) => {
  if (!component || !component.canDeactivate) {
    return true;
  }

  const loadingService = inject(LoadingService);
  // NavigationStart has already activated the global loader.
  // Temporarily pause it so the confirmation modal is not covered or blocked.
  loadingService.stop();

  try {
    const rawResult = component.canDeactivate(nextState);
    if (rawResult instanceof Promise) {
      return await rawResult;
    } else if (isObservable(rawResult)) {
      return await firstValueFrom(rawResult);
    }
    return rawResult;
  } finally {
    // Re-enable loader so subsequent navigation completion/cancellation cleanly balances the counter.
    loadingService.start();
  }
};
