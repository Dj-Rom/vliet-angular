import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Mobile } from './mobile/mobile';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [Mobile],
  templateUrl: './navigation.html',
  styleUrls: ['./navigation.css'],
})
export class Navigation {
  menuOpen = false;
  isMobile: boolean = typeof window !== 'undefined' ? window.innerWidth < 768 : true;

  user = computed(() => {
    const email = this.authService.userEmail();
    return email ? email.split('@')[0] : null;
  });

  isLoggedIn = computed(() => this.authService.isAuthenticated());

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
  }
}
