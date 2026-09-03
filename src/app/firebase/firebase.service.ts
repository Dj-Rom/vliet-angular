import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  Firestore,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { _WayBill, _VehicleFleet } from '../../interfaces';
import { AlertService } from '../core/services/alert.service';
import { AppCookieService } from '../core/services/cookie.service';
import { LoadingService } from '../core/services/loading.service';
import { getPerformance } from 'firebase/performance';

export interface SharedAddress {
  id: string;
  company: string;
  address: string;
  google_link: string;
  gps: string;
  notes?: string;
}

// Single initialized Firebase instances with IndexedDB offline persistence
export const app = getApps().length ? getApp() : initializeApp(environment.firebase);
export const auth = getAuth(app);

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // If already initialized (e.g. during fast reloads / HMR)
  firestoreInstance = (app as any)._firestore || initializeFirestore(app, {});
}
export const db = firestoreInstance;

if (typeof window !== 'undefined') {
  try {
    getPerformance(app);
  } catch {}
}

@Injectable({ providedIn: 'root' })
export class FirebaseClientService {
  public auth = auth;
  public db = db;
  private user: User | null = null;

  /** Backward-compat alias – reads from the global LoadingService */
  readonly isLoading;

  constructor(
    private alert: AlertService,
    private cookieService: AppCookieService,
    private loadingService: LoadingService,
  ) {
    this.isLoading = this.loadingService.isLoading;
    this.user = this.auth.currentUser;
    onAuthStateChanged(this.auth, (u) => {
      this.user = u;
    });
  }

  public getCurrentUid(): string | null {
    if (this.auth.currentUser?.uid) return this.auth.currentUser.uid;
    if (this.user?.uid) return this.user.uid;
    const session = this.cookieService.getJson<{ uid: string }>('van-vliet-session');
    if (session?.uid) return session.uid;
    const legacyCookie = this.cookieService.getCookie('van-vliet');
    if (legacyCookie) {
      try {
        const parsed = JSON.parse(legacyCookie);
        return parsed?.uid || legacyCookie;
      } catch {
        return legacyCookie;
      }
    }
    return null;
  }

  // ===== Helper =====
  private async withLoading<T>(fn: () => Promise<T>): Promise<T> {
    return this.loadingService.wrap(fn);
  }

  private async hasAccess(): Promise<boolean> {
    const uid = this.getCurrentUid();
    if (!uid) return false;
    try {
      const docSnap = await getDoc(doc(this.db, 'users', uid));
      if (!docSnap.exists()) return false;
      const data = docSnap.data();
      return data?.['status'] === true;
    } catch (e) {
      // Offline fallback: check cached user session
      const session = this.cookieService.getJson<{ status?: boolean }>('van-vliet-session');
      if (session?.status !== undefined) return session.status;
      return true;
    }
  }

  // Automatically include createdAt
  private addCreatedAt<T>(data: T): T & { createdAt: string } {
    return { ...data, createdAt: new Date().toISOString() };
  }

  // ================= AUTH =================

  async signUp(email: string, password: string, fullName: string): Promise<User> {
    return this.withLoading(async () => {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await setDoc(
        doc(this.db, 'users', cred.user.uid),
        this.addCreatedAt({
          packageHistory: {},
          status: false,
          userData: {
            uid: cred.user.uid,
            email,
            fullName,
            createdAt: new Date().toISOString(),
          },
          waybills: {},
        }),
      );
      this.user = cred.user;
      return cred.user;
    });
  }

  async signIn(email: string, password: string, rememberMe = false): Promise<User> {
    return this.withLoading(async () => {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      this.user = cred.user;
      if (this.user?.uid) {
        this.cookieService.setJson(
          'van-vliet-session',
          {
            uid: this.user.uid,
            email: this.user.email,
            displayName: this.user.displayName,
          },
          rememberMe ? 30 : 7,
        );
      }
      return cred.user;
    });
  }

  async signOutUser(): Promise<void> {
    return this.withLoading(async () => {
      try {
        await signOut(this.auth);
      } finally {
        this.user = null;
        this.cookieService.deleteCookie('van-vliet-session');
        this.cookieService.deleteCookie('van-vliet');
        this.cookieService.deleteCookie('van-vliet-email');
      }
    });
  }

  async isLoggedIn(): Promise<boolean> {
    if (this.auth.currentUser) return true;
    return new Promise<boolean>((res) => {
      const unsub = onAuthStateChanged(this.auth, (user) => {
        res(!!user);
        unsub();
      });
    });
  }

  currentUser(): User | null {
    return this.auth.currentUser || this.user;
  }

  getUserEmail(): string | null {
    return this.auth.currentUser?.email || this.user?.email || null;
  }

  // ================= PROFILE =================

  async updateUserName(fullName: string) {
    const user = this.currentUser();
    if (!user) return;
    return this.withLoading(async () => {
      await updateProfile(user, { displayName: fullName });
      await updateDoc(doc(this.db, 'users', user.uid), {
        'userData.fullName': fullName,
      });
    });
  }

  async updateUserEmail(email: string) {
    const user = this.currentUser();
    if (!user) return;
    return this.withLoading(async () => {
      await updateEmail(user, email);
      await updateDoc(doc(this.db, 'users', user.uid), {
        'userData.email': email,
      });
    });
  }

  async updateUserPassword(newPassword: string) {
    const user = this.currentUser();
    if (!user) return;
    return this.withLoading(async () => {
      await updatePassword(user, newPassword);
    });
  }

  async deleteUserAccount(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    return this.withLoading(async () => {
      const uid = user.uid;
      await deleteDoc(doc(this.db, 'users', uid));
      await deleteUser(user);
      this.user = null;
      this.cookieService.deleteCookie('van-vliet-session');
      this.cookieService.deleteCookie('van-vliet');
      this.cookieService.deleteCookie('van-vliet-email');
    });
  }

  // ================= USER DATA =================

  async saveUserData(uid: string, data: Record<string, any>) {
    return this.withLoading(async () => {
      await setDoc(doc(this.db, 'users', uid), this.addCreatedAt(data), { merge: true });
    });
  }

  async getUserData(uid: string) {
    return this.withLoading(async () => {
      const snap = await getDoc(doc(this.db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    });
  }

  // ================= SHARED ADDRESSES =================

  async getSharedAddresses(): Promise<SharedAddress[]> {
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      try {
        const snap = await getDocs(collection(this.db, 'shared_addresses'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SharedAddress);
      } catch (e) {
        console.warn('Error getting shared addresses:', e);
        return [];
      }
    });
  }

  subscribeToSharedAddresses(
    callback: (addresses: SharedAddress[]) => void,
    onError?: (error: any) => void,
  ): Unsubscribe {
    const colRef = collection(this.db, 'shared_addresses');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SharedAddress);
        callback(list);
      },
      (err) => {
        console.warn('Realtime sync error on shared_addresses:', err);
        if (onError) onError(err);
      },
    );
  }

  async addAddress(
    company: string,
    address: string,
    google_link: string,
    gps: string,
    notes: string,
  ) {
    return this.withLoading(async () => {
      const ref = doc(collection(this.db, 'shared_addresses'));
      await setDoc(ref, this.addCreatedAt({ company, address, google_link, gps, notes }));
    });
  }

  async updateSharedAddress(id: string, data: any) {
    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );
      await updateDoc(doc(this.db, 'shared_addresses', id), cleanData);
    });
  }

  async deleteSharedAddress(id: string) {
    return this.withLoading(async () => {
      await deleteDoc(doc(this.db, 'shared_addresses', id));
    });
  }

  // ================= VEHICLE FLEET =================

  async getVehicleFleet(): Promise<_VehicleFleet[]> {
    return this.withLoading(async () => {
      try {
        const snap = await getDocs(collection(this.db, 'vehicle_fleet'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _VehicleFleet);
      } catch (e) {
        console.warn('Error getting vehicle fleet:', e);
        return [];
      }
    });
  }

  async addVehicleFleet(vehicle_number: string, type: string, brand: string) {
    return this.withLoading(async () => {
      const ref = doc(collection(this.db, 'vehicle_fleet'));
      await setDoc(ref, this.addCreatedAt({ vehicle_number, type, brand }));
    });
  }

  async updateVehicleFleet(id: string, data: any) {
    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );
      await updateDoc(doc(this.db, 'vehicle_fleet', id), cleanData);
    });
  }

  async deleteVehicleFleet(id: string) {
    return this.withLoading(async () => {
      await deleteDoc(doc(this.db, 'vehicle_fleet', id));
    });
  }

  // ================= PACKAGE HISTORY =================

  async getPackageHistory(): Promise<_WayBill[]> {
    const uid = this.getCurrentUid();
    if (!uid) return [];
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      try {
        const snap = await getDocs(collection(this.db, 'users', uid, 'packageHistory'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _WayBill);
      } catch (e) {
        console.warn('Error getting package history:', e);
        return [];
      }
    });
  }

  async addNewPackageList(data: any) {
    const uid = this.getCurrentUid();
    if (!uid) return;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return;
    }
    return this.withLoading(async () => {
      const ref = doc(collection(this.db, 'users', uid, 'packageHistory'));
      await setDoc(ref, this.addCreatedAt(data));
    });
  }

  async updatePackageHistory(id: string, data: any) {
    const uid = this.getCurrentUid();
    if (!uid) return;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return;
    }
    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );
      await updateDoc(doc(this.db, 'users', uid, 'packageHistory', id), cleanData);
    });
  }

  async deletePackageHistory(id: string) {
    const uid = this.getCurrentUid();
    if (!uid) return;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return;
    }
    return this.withLoading(async () => {
      await deleteDoc(doc(this.db, 'users', uid, 'packageHistory', id));
    });
  }

  // ================= WAYBILL HISTORY =================

  async getWillBillsHistory(): Promise<_WayBill[]> {
    const uid = this.getCurrentUid();
    if (!uid) return [];

    return this.withLoading(async () => {
      try {
        const snap = await getDocs(collection(this.db, 'users', uid, 'waybills'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _WayBill);
      } catch (e) {
        console.warn('Error getting waybills history:', e);
        return [];
      }
    });
  }

  subscribeToWayBillsHistory(
    callback: (waybills: _WayBill[]) => void,
    onError?: (error: any) => void,
  ): Unsubscribe {
    const uid = this.getCurrentUid();
    if (!uid) return () => {};

    const colRef = collection(this.db, 'users', uid, 'waybills');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as _WayBill);
        callback(list);
      },
      (err) => {
        console.warn('Realtime sync error on waybills:', err);
        if (onError) onError(err);
      },
    );
  }

  async addInfoForCurrentUser(data: any) {
    const uid = this.getCurrentUid();
    if (!uid) return;

    return this.withLoading(async () => {
      try {
        const ref = doc(collection(this.db, 'users', uid, 'waybills'));
        await setDoc(ref, this.addCreatedAt(data));
      } catch (error) {
        this.alert.show('error', `Błąd: ${error}`);
      }
    });
  }

  async updateWayBillsHistory(id: string, data: any) {
    const uid = this.getCurrentUid();
    if (!uid) return;

    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );
      await updateDoc(doc(this.db, 'users', uid, 'waybills', id), cleanData);
    });
  }

  async deleteWayBillHistory(id: string) {
    const uid = this.getCurrentUid();
    if (!uid) return;

    return this.withLoading(async () => {
      try {
        await deleteDoc(doc(this.db, 'users', uid, 'waybills', id));
      } catch (error) {
        this.alert.show('error', `Błąd usuwania: ${error}`);
        throw error;
      }
    });
  }

  // ================= COOKIE COMPATIBILITY =================

  setCookie(name: string, value: string, days = 7) {
    this.cookieService.setCookie(name, value, days);
  }

  getCookie(name: string): string | null {
    return this.cookieService.getCookie(name);
  }

  deleteCookie(name: string) {
    this.cookieService.deleteCookie(name);
  }

  async isCookieUidValid(): Promise<boolean> {
    const uid = this.getCurrentUid();
    if (!uid) return false;
    try {
      const docSnap = await getDoc(doc(this.db, 'users', uid));
      return docSnap.exists();
    } catch {
      return true; // Assume valid offline if we have uid
    }
  }
}
