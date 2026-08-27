import { Injectable, computed } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  isLoggedIn = computed(() => this.authService.isAuthenticated());

  constructor(private authService: AuthService) {}
}
