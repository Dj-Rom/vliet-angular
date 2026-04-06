import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { AlertService } from './alert.service';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(initializeApp(environment.firebase));

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);

  private readonly AUTH_CACHE_KEY = 'auth_status_cache';
  private readonly AUTH_TIMESTAMP_KEY = 'auth_timestamp_cache';
  private readonly USER_CACHE_KEY = 'user_data_cache';

  constructor(
    private router: Router,
    private fb: FirebaseClientService,
    private alert: AlertService,
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    this.loadFromCache();

    onAuthStateChanged(this.auth, (user) => {

      this.userSubject.next(user);
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);

      if (user) {
        this.cacheAuthStatus(true, user);
      } else {
        this.clearAuthCache();
      }
    });
  }

  private loadFromCache(): void {
    try {
      const cachedStatus = localStorage.getItem(this.AUTH_CACHE_KEY);
      const cachedUser = localStorage.getItem(this.USER_CACHE_KEY);

      if (cachedStatus === 'true' && cachedUser) {
        const userData = JSON.parse(cachedUser);
        this.isAuthenticated.set(true);
      }
    } catch (error) {
      console.error('❌ Error loading auth cache:', error);
    }
  }

  private cacheAuthStatus(isAuthenticated: boolean, user?: User | null): void {
    try {
      localStorage.setItem(this.AUTH_CACHE_KEY, isAuthenticated.toString());
      localStorage.setItem(this.AUTH_TIMESTAMP_KEY, Date.now().toString());

      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        localStorage.setItem(this.USER_CACHE_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('❌ Error caching auth:', error);
    }
  }

  private clearAuthCache(): void {
    try {
      localStorage.removeItem(this.AUTH_CACHE_KEY);
      localStorage.removeItem(this.AUTH_TIMESTAMP_KEY);
      localStorage.removeItem(this.USER_CACHE_KEY);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);

      this.alert.show('success', 'Logged in successfully!');

      await this.router.navigate(['/']);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      this.alert.show('error', `Login failed: ${error.message}`);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.fb.signOutUser();
      await signOut(this.auth);

      this.clearAuthCache();
      this.alert.show('success', 'Signed out!');

      await this.router.navigate(['/auth/sign-in']);
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      this.alert.show('error', `Logout failed: ${error.message}`);
      throw error;
    }
  }

  getUser(): User | null {
    return this.auth.currentUser;
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  async isLoggedInAsync(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  async getIdToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      if (!user) return null;
      return await user.getIdToken(true); // force refresh
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return null;
    }
  }
}
