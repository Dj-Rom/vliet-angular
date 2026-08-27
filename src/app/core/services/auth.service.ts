import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  User,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { auth, db } from '../../firebase/firebase.service';
import { AlertService } from './alert.service';
import { AppCookieService } from './cookie.service';

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  status?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = auth;
  private db = db;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  public currentUser = signal<User | null>(null);
  public sessionUser = signal<UserSession | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public isAuthReady = signal<boolean>(false);

  public userEmail = computed(() => this.currentUser()?.email || this.sessionUser()?.email || null);
  public displayName = computed(
    () => this.currentUser()?.displayName || this.sessionUser()?.displayName || null,
  );

  private readonly SESSION_COOKIE_KEY = 'van-vliet-session';
  private readonly LEGACY_COOKIE_KEY = 'van-vliet';
  private readonly AUTH_CACHE_KEY = 'auth_status_cache';
  private readonly USER_CACHE_KEY = 'user_data_cache';

  constructor(
    private router: Router,
    private alert: AlertService,
    private cookieService: AppCookieService,
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // 1. Instant hydration from cookie / localStorage for offline support
    this.loadFromCache();

    // 2. Firebase Auth state listener
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.userSubject.next(user);

      if (user) {
        this.isAuthenticated.set(true);
        const session: UserSession = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        this.sessionUser.set(session);
        this.cacheAuthStatus(true, session);
      } else {
        // If offline and we had a cached session, preserve it
        if (!navigator.onLine && this.sessionUser()) {
          this.isAuthenticated.set(true);
        } else {
          this.isAuthenticated.set(false);
          this.sessionUser.set(null);
          this.clearAuthCache();
        }
      }
    });

    // 3. Wait for Firebase auth to initialize from IndexedDB
    try {
      if (typeof (this.auth as any).authStateReady === 'function') {
        await this.auth.authStateReady();
      }
    } catch (e) {
      console.warn('Auth state ready check completed with warning (offline mode):', e);
    } finally {
      this.isAuthReady.set(true);
      if (this.auth.currentUser) {
        this.currentUser.set(this.auth.currentUser);
        this.isAuthenticated.set(true);
      }
    }
  }

  private loadFromCache(): void {
    try {
      // Try reading structured session cookie
      const session = this.cookieService.getJson<UserSession>(this.SESSION_COOKIE_KEY);
      if (session?.uid) {
        this.sessionUser.set(session);
        this.isAuthenticated.set(true);
        return;
      }

      // Try legacy cookie
      const legacy = this.cookieService.getCookie(this.LEGACY_COOKIE_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed?.uid) {
            const legacySession: UserSession = {
              uid: parsed.uid,
              email: parsed.email || null,
              displayName: parsed.displayName || null,
            };
            this.sessionUser.set(legacySession);
            this.isAuthenticated.set(true);
            return;
          }
        } catch {}
      }

      // Try localStorage
      const cachedStatus = localStorage.getItem(this.AUTH_CACHE_KEY);
      const cachedUser = localStorage.getItem(this.USER_CACHE_KEY);
      if (cachedStatus === 'true' && cachedUser) {
        const userData = JSON.parse(cachedUser) as UserSession;
        this.sessionUser.set(userData);
        this.isAuthenticated.set(true);
      }
    } catch (error) {
      console.warn('Error loading auth from cache:', error);
    }
  }

  private cacheAuthStatus(isAuth: boolean, session?: UserSession | null, rememberMe = true): void {
    try {
      localStorage.setItem(this.AUTH_CACHE_KEY, isAuth.toString());
      if (session) {
        const days = rememberMe ? 30 : 7;
        this.cookieService.setJson(this.SESSION_COOKIE_KEY, session, days);
        localStorage.setItem(this.USER_CACHE_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.warn('Error caching auth status:', error);
    }
  }

  private clearAuthCache(): void {
    try {
      this.cookieService.deleteCookie(this.SESSION_COOKIE_KEY);
      this.cookieService.deleteCookie(this.LEGACY_COOKIE_KEY);
      this.cookieService.deleteCookie('van-vliet-email');
      localStorage.removeItem(this.AUTH_CACHE_KEY);
      localStorage.removeItem('auth_timestamp_cache');
      localStorage.removeItem(this.USER_CACHE_KEY);
    } catch (error) {
      console.warn('Error clearing auth cache:', error);
    }
  }

  async login(email: string, password: string, rememberMe = true): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const session: UserSession = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      this.currentUser.set(user);
      this.sessionUser.set(session);
      this.isAuthenticated.set(true);
      this.cacheAuthStatus(true, session, rememberMe);

      this.alert.show('success', 'Zalogowano pomyślnie!');
      await this.router.navigate(['/app/waybill-new']);
      return user;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      let message = error.message;
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        message = 'Nieprawidłowy adres email lub hasło.';
      }
      this.alert.show('error', `Błąd logowania: ${message}`);
      throw error;
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<User> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      await setDoc(doc(this.db, 'users', cred.user.uid), {
        packageHistory: {},
        status: false,
        userData: {
          uid: cred.user.uid,
          email,
          fullName,
          createdAt: new Date().toISOString(),
        },
        waybills: {},
        createdAt: new Date().toISOString(),
      });

      const session: UserSession = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: fullName,
      };

      this.currentUser.set(cred.user);
      this.sessionUser.set(session);
      this.isAuthenticated.set(true);
      this.cacheAuthStatus(true, session, true);

      this.alert.show('success', 'Konto zostało pomyślnie utworzone!');
      return cred.user;
    } catch (error: any) {
      console.error('❌ SignUp error:', error);
      this.alert.show('error', `Rejestracja nie powiodła się: ${error.message}`);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      console.warn('SignOut warning:', error);
    } finally {
      this.currentUser.set(null);
      this.sessionUser.set(null);
      this.isAuthenticated.set(false);
      this.clearAuthCache();
      this.alert.show('success', 'Wylogowano pomyślnie.');
      await this.router.navigate(['/auth/sign-in']);
    }
  }

  getUser(): User | null {
    return this.auth.currentUser || this.currentUser();
  }

  getUid(): string | null {
    return this.auth.currentUser?.uid || this.currentUser()?.uid || this.sessionUser()?.uid || null;
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser || this.isAuthenticated() || !!this.sessionUser();
  }

  async isLoggedInAsync(): Promise<boolean> {
    try {
      if (typeof (this.auth as any).authStateReady === 'function') {
        await this.auth.authStateReady();
      }
      if (this.auth.currentUser) {
        this.currentUser.set(this.auth.currentUser);
        this.isAuthenticated.set(true);
        return true;
      }
    } catch (e) {
      console.warn('isLoggedInAsync authStateReady check warning:', e);
    }

    // Check cached session in cookie or localStorage (offline resilience)
    const session = this.cookieService.getJson<UserSession>(this.SESSION_COOKIE_KEY);
    if (session?.uid) {
      this.sessionUser.set(session);
      this.isAuthenticated.set(true);
      return true;
    }

    const legacy = this.cookieService.getCookie(this.LEGACY_COOKIE_KEY);
    if (legacy) {
      this.isAuthenticated.set(true);
      return true;
    }

    return this.isLoggedIn();
  }

  async updateUserName(fullName: string): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    await updateProfile(user, { displayName: fullName });
    await updateDoc(doc(this.db, 'users', user.uid), {
      'userData.fullName': fullName,
    });
    if (this.sessionUser()) {
      this.sessionUser.update((s) => (s ? { ...s, displayName: fullName } : null));
      this.cacheAuthStatus(true, this.sessionUser());
    }
  }

  async updateUserEmail(email: string): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    await updateEmail(user, email);
    await updateDoc(doc(this.db, 'users', user.uid), {
      'userData.email': email,
    });
    if (this.sessionUser()) {
      this.sessionUser.update((s) => (s ? { ...s, email } : null));
      this.cacheAuthStatus(true, this.sessionUser());
    }
  }

  async updateUserPassword(newPassword: string): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    await updatePassword(user, newPassword);
  }

  async deleteUserAccount(): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    const uid = user.uid;
    await deleteDoc(doc(this.db, 'users', uid));
    await deleteUser(user);
    await this.logout();
  }

  async getIdToken(): Promise<string | null> {
    try {
      const user = this.getUser();
      if (!user) return null;
      return await user.getIdToken();
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const user = this.getUser();
      if (!user) return null;
      return await user.getIdToken(true);
    } catch {
      return null;
    }
  }
}
