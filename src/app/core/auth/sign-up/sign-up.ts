import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {FirebaseClientService} from '../../../firebase/firebase.service';

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
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),
    ]),
  });

  constructor(private fb: FirebaseClientService, private router: Router) {}

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

    const {email, password, name } = this.form.value;

    try {

      const user = await this.fb.signUp(email!, password!, name!);

      if (user?.uid) {

        await this.fb.saveUserData(user.uid, {
          email: email,
          createdAt: new Date().toISOString(),
        });

        console.log('✅ Registration successful:', user.uid);
        this.message = 'Registration successful! Redirecting...';


        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      this.message = error.message || 'Registration failed. Try again.';
    } finally {
      this.loading = false;
    }
  }
}

