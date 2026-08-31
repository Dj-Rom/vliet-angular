import { Component, NgZone, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerComponent } from '../../shared/spinner/spinner';
import { MobileNavigationService } from '../../core/services/mobile-navigation.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, SpinnerComponent],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.css'],
})
export class SignIn {
  loading = false;
  errorMessage = '';
  isShow = false;
  isFirstTime = signal<boolean>(true);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rm: new FormControl(true),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private naviService: MobileNavigationService,
    private ngZone: NgZone,
  ) {
    this.checkIfAlreadyLoggedIn();
    setTimeout(() => this.isFirstTime.set(false), 900);
  }

  private async checkIfAlreadyLoggedIn(): Promise<void> {
    const isLogged = await this.authService.isLoggedInAsync();
    if (isLogged) {
      this.ngZone.run(() => {
        this.naviService.navigate('app');
      });
    }
  }

  setShow() {
    this.isShow = !this.isShow;
  }

  async onSubmit() {
    if (document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      console.warn('Fullscreen API не поддерживается в этом браузере/режиме');
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { email, password, rm } = this.form.value;

    try {
      await this.authService.login(email!, password!, !!rm);
      this.ngZone.run(() => {
        this.naviService.navigate('app');
      });
    } catch (error: any) {
      if (
        error.code === 'auth/invalid-credential' ||
        error.message?.includes('invalid-credential') ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        this.errorMessage = 'Nieprawidłowy email lub hasło.';
      } else {
        this.errorMessage = error.message || 'Wystąpił błąd podczas logowania.';
      }
    } finally {
      this.loading = false;
    }
  }
}
