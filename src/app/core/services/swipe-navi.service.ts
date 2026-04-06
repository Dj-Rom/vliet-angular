import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MobileNavigationService } from './mobile-navigation.service';

@Injectable({ providedIn: 'root' })
export class SwipeNavigationService {
  private startX = 0;
  private threshold = 160;
  private throttle = 400;
  private lastActionTime = 0;
  private swipeHandled = false;

  isEnabled = signal<boolean>(true);

  constructor(
    private router: Router,
    private mobileNavigationService: MobileNavigationService,
  ) {}

  init() {
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd);
  }

  destroy() {
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }

  private onTouchStart = (event: TouchEvent) => {
    if (!this.isEnabled()) return;

    this.startX = event.touches[0].clientX;
    this.swipeHandled = false;
  };

  private onTouchMove = (event: TouchEvent) => {
    if (!this.isEnabled() || this.swipeHandled) return;

    const now = Date.now();
    if (now - this.lastActionTime < this.throttle) return;

    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.startX;

    if (Math.abs(deltaX) < this.threshold) return;

    this.handleNavigation(deltaX > 0);

    this.lastActionTime = now;
    this.swipeHandled = true;
  };

  private onTouchEnd = () => {
    this.swipeHandled = false;
  };

  private handleNavigation(movingRight: boolean) {
    const url = this.router.url;
    const urlArray = url.split('/');
    if (urlArray.length > 2) {
      this.router.navigate([urlArray[0], urlArray[1]]);
      return;
    }
    if (url.startsWith('/app/load-location')) {
      this.mobileNavigationService.navigate(movingRight ? '/app/waybill-new' : '/app/profile');
      return;
    }
    if (url.startsWith('/app/profile')) {
      if (movingRight) {
        this.mobileNavigationService.navigate('/app/load-location');
      }
      return;
    }

    if (url.startsWith('/app/waybill-new')) {
      this.mobileNavigationService.navigate(
        movingRight ? '/app/available-capacity' : '/app/load-location',
      );
      return;
    }

    if (url.startsWith('/app/load-management/all')) {
      if (!movingRight) {
        this.mobileNavigationService.navigate('/app/available-capacity');
      }
      return;
    }

    if (url.startsWith('/app/available-capacity')) {
      this.mobileNavigationService.navigate(
        movingRight ? '/app/load-management/all' : '/app/waybill-new',
      );
    }
  }
}
