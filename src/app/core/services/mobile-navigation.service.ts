import { Injectable, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class MobileNavigationService {
  /* ─────────────────────────── */
  /* STATE                       */
  /* ─────────────────────────── */
  menuOpen = signal<boolean>(false);
  isMobile = signal<boolean>(window.innerWidth < 768);
  currentActivePath = signal<string>('');

  isLoggedIn = computed(() => this.authService.isAuthenticated());
  user = computed(() => {
    const email = this.authService.userEmail();
    return email ? email.split('@')[0] : null;
  });

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.setCurrentPath();
    this.listenResize();
    this.listenNavigation();
  }

  private setCurrentPath(): void {
    this.currentActivePath.set(window.location.pathname);
  }

  private listenNavigation(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentActivePath.set(event.urlAfterRedirects || event.url);
      }
    });
  }

  private listenResize() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
  }

  /* ─────────────────────────── */
  /* NAVIGATION                  */
  /* ─────────────────────────── */
  navigate(path: string): void {


    path = path === 'app' ? '/app/waybill-new' : path;
    this.currentActivePath.set(path);
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.currentActivePath().includes(path);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
