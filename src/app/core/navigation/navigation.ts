import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import {AuthService} from '../../services/auth-service';
import {Mobile} from './mobile/mobile';




@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, NgIf, Mobile],
  templateUrl: './navigation.html',
  styleUrls: ['./navigation.css']
})
export class Navigation {
  menuOpen = false;
  isMobile: boolean = window.innerWidth < 768;
  isLoggedIn: any;
  user: string | null | undefined = null;
  constructor(private authService: AuthService, private fb: FirebaseClientService, private router: Router) {
    this.user = this.authService.getUser()?.email;
    this.isLoggedIn = this.authService.isLoggedIn();
    this.user = this.user?.slice(0, this.user?.indexOf('@'))
  }



  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async logout(): Promise<void> {
    try {
      this.closeMenu();
      await this.fb.signOutUser();
      console.log('🚪 Logged out');
      this.isLoggedIn = false;
      await this.router.navigate(['/auth/sing-in']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
