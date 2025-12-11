import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import {BehaviorSubject, Observable} from 'rxjs';
import {FirebaseClientService} from '../firebase/firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(initializeApp(environment.firebase));
  private userSubject = new BehaviorSubject<User | null>(null);
  private user = this.userSubject.asObservable();
  private static user: Observable<User | null>;

  constructor(private router: Router, private fb: FirebaseClientService) {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }


  async logout() {
    await this.fb.signOutUser();
    await this.router.navigate(['/auth/sign-in']);
  }
  getUser() {
    return this.auth.currentUser;
  }

   isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
