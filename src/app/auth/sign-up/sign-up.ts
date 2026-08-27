import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  isShow = false;
  loading = false;
  message = '';

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),
    ]),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private alert: AlertService,
  ) {}

  setShow() {
    this.isShow = !this.isShow;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.message = '';

    const { email, password, name } = this.form.value;

    try {
      await this.authService.signUp(email!, password!, name!);
      setTimeout(() => this.router.navigate(['/app/waybill-new']), 1000);
    } catch (error: any) {
      this.message = error.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.';
    } finally {
      this.loading = false;
    }
  }
}
