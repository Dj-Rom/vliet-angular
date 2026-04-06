import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FirebaseClientService } from '../../firebase/firebase.service';

@Injectable({ providedIn: 'root' })
export class MobileNavigationService {
  /* ─────────────────────────── */
  /* STATE                       */
  /* ─────────────────────────── */
  menuOpen = signal<boolean>(false);
  isMobile = signal<boolean>(window.innerWidth < 768);
  isLoggedIn = signal<boolean>(false);
  user = signal<string | null>(null);
  currentActivePath = signal<string>('');

  constructor(
    private authService: AuthService,
    private fb: FirebaseClientService,
    private router: Router,
  ) {
    this.initUser();
    this.setCurrentPath();
    this.listenResize();
  }

  /* ─────────────────────────── */
  /* INIT                        */
  /* ─────────────────────────── */
  private initUser(): void {
    const email = this.authService.getUser()?.email;
    this.user.set(email ? email.split('@')[0] : null);
    this.isLoggedIn.set(!!email);

  }

   private  setCurrentPath(): void {
  const path = window.location.pathname;
    this.currentActivePath.set(path);
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
    path = path == 'app'? '/app/waybill-new': path;
    this.isActive(path)
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
