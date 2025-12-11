import { Component, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FirebaseClientService } from '../../../firebase/firebase.service';
import { User } from 'firebase/auth';
import { AppCookieService } from '../../../services/cookie';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.css'], // поправлено
})
export class SignIn {
  loading = false;
  errorMessage = '';
  isShow = false;
  user: User | undefined;
  isCookieUIDValid: string | null = '';


  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rm: new FormControl(false), // тип boolean для "Remember Me"
  });

constructor(
    private fb: FirebaseClientService,
    private router: Router,
    private ngZone: NgZone,
    private cookieService: AppCookieService
  ) {
    this.isCookieUIDValid =  this.fb.getCookie('van-vliet');
      if(!!this.isCookieUIDValid) this.router.navigate(['app']);
  }

  setShow() {
    this.isShow = !this.isShow;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { email, password, rm } = this.form.value;

    try {

      this.user = await this.fb.signIn(email!, password!, !!rm);


      if (rm && this.user?.uid) {
        this.cookieService.setCookie('van-vliet', JSON.stringify(this.user), 7);

      }
      this.ngZone.run(() => {
        this.router.navigate(['app']);
      });

    } catch (error: any) {
      this.errorMessage =
        error.message === 'Firebase: Error (auth/invalid-credential).'
          ? 'Invalid email or password.'
          : error.message;
    } finally {
      this.loading = false;
    }
  }

  protected readonly console = console;
}
