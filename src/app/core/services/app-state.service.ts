import { Injectable, signal } from '@angular/core';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  isLoggedIn = signal(false);
  constructor(authService: AuthService) {
    this.isLoggedIn.set(authService.isAuthenticated());
  }
}
