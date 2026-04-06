import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
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
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { _WayBill, _VehicleFleet } from '../../interfaces';
import { AlertService } from '../core/services/alert.service';
import { getPerformance } from "firebase/performance";
export interface SharedAddress {
  id: string;
  company: string;
  address: string;
  google_link: string;
  gps: string;
  notes?: string;
}

// Init Firebase
const app = initializeApp(environment.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const perf = getPerformance(app);
@Injectable({ providedIn: 'root' })
export class FirebaseClientService {
  private auth = auth;
  private db = db;
  private user: User | null = null;
  private uid: string | null = null;
  isLoading = signal(false);

  constructor(private alert: AlertService) {
    onAuthStateChanged(this.auth, (u) => (this.user = u));
    if (this.getCookie('van-vliet')) {
      this.uid = this.getCookie('van-vliet');
    }
  }

  // ===== Helper =====
  private async withLoading<T>(fn: () => Promise<T>): Promise<T> {
    this.isLoading.set(true);
    try {
      return await fn();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async hasAccess(): Promise<boolean> {
    if (!this.user?.uid) return false;
    const docSnap = await getDoc(doc(this.db, 'users', this.user.uid));
    if (!docSnap.exists()) return false;
    const data = docSnap.data();
    return data?.['status'] === true;
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
      return cred.user;
    });
  }

  async signIn(email: string, password: string, rememberMe = false): Promise<User> {
    return this.withLoading(async () => {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      this.user = cred.user;
      if (rememberMe && this.user?.uid) {
        this.setCookie('van-vliet', JSON.stringify(this.user), 7);
      }
      return cred.user;
    });
  }

  async signOutUser(): Promise<void> {
    return this.withLoading(async () => {
      await signOut(this.auth);
      this.user = null;
      this.deleteCookie('van-vliet');
    });
  }

  async isLoggedIn(): Promise<boolean> {
    return this.withLoading(
      () =>
        new Promise<boolean>((res) => {
          const unsub = onAuthStateChanged(this.auth, (user) => {
            res(!!user);
            unsub();
          });
        }),
    );
  }

  currentUser() {
    return this.auth.currentUser;
  }

  getUserEmail() {
    return this.user?.email || null;
  }

  // ================= PROFILE =================

  async updateUserName(fullName: string) {
    if (!this.auth.currentUser) return;
    return this.withLoading(async () => {
      await updateProfile(this.auth.currentUser!, { displayName: fullName });
      await updateDoc(doc(this.db, 'users', this.auth.currentUser!.uid), {
        'userData.fullName': fullName,
      });
    });
  }

  async updateUserEmail(email: string) {
    if (!this.auth.currentUser) return;
    return this.withLoading(async () => {
      await updateEmail(this.auth.currentUser!, email);
      await updateDoc(doc(this.db, 'users', this.auth.currentUser!.uid), {
        'userData.email': email,
      });
    });
  }

  async updateUserPassword(newPassword: string) {
    if (!this.auth.currentUser) return;
    return this.withLoading(async () => {
      await updatePassword(this.auth.currentUser!, newPassword);
    });
  }

  async deleteUserAccount(): Promise<void> {
    if (!this.auth.currentUser) return;
    return this.withLoading(async () => {
      await deleteDoc(doc(this.db, 'users', this.auth.currentUser!.uid));
      await deleteUser(this.auth.currentUser!);
      this.user = null;
      this.deleteCookie('van-vliet');
      this.deleteCookie('van-vliet-email');
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
      const snap = await getDocs(collection(this.db, 'shared_addresses'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SharedAddress);
    });
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
      const snap = await getDocs(collection(this.db, 'vehicle_fleet'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _VehicleFleet);
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
    if (!this.user?.uid) return [];
    const uid = this.user.uid;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      const snap = await getDocs(collection(this.db, uid, 'packageHistory'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _WayBill);
    });
  }

  async addNewPackageList(data: any) {
    if (!this.user?.uid) return;
    const uid = this.user.uid;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      const ref = doc(collection(this.db, uid, 'packageHistory'));
      await setDoc(ref, this.addCreatedAt(data));
    });
  }

  async updatePackageHistory(id: string, data: any) {
    if (!this.user?.uid) return;
    const uid = this.user.uid;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );
      await updateDoc(doc(this.db, 'users', uid, 'packageHistory', id), cleanData);
    });
  }

  async deletePackageHistory(id: string) {
    if (!this.user?.uid) return;
    const uid = this.user.uid;
    const access = await this.hasAccess();
    if (!access) {
      this.alert.show(
        'error',
        'Twój dostęp nie został jeszcze zatwierdzony, prosimy poczekać 24 godziny',
      );
      return [];
    }
    return this.withLoading(async () => {
      await deleteDoc(doc(this.db, 'users', uid, 'packageHistory', id));
    });
  }

  // ================= WAYBILL HISTORY =================

  async getWillBillsHistory(): Promise<_WayBill[]> {
    if (!this.user?.uid) return [];
    const uid = this.user.uid;

    return this.withLoading(async () => {
      const snap = await getDocs(collection(this.db, 'users', uid, 'waybills'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as _WayBill);
    });
  }

  async addInfoForCurrentUser(data: any) {
    if (!this.user?.uid) return;
    const uid = this.user.uid;

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
    if (!this.user?.uid) return;
    const uid = this.user.uid;

    return this.withLoading(async () => {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );

      await updateDoc(doc(this.db, 'users', uid, 'waybills', id), cleanData);
    });
  }

  async deleteWayBillHistory(id: string) {
    if (!this.user?.uid) return;
    const uid = this.user.uid;

    const access = await this.hasAccess();

    return this.withLoading(async () => {
      try {
        // Исправленный путь: коллекция waybills внутри пользователя
        await deleteDoc(doc(this.db, 'users', uid, 'waybills', id));
      } catch (error) {
        this.alert.show('error', `Błąd usuwania: ${error}`);
        throw error;
      }
    });
  }

  // ================= COOKIE =================

  setCookie(name: string, value: string, days = 7) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
  }

  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  deleteCookie(name: string) {
    this.setCookie(name, '', -1);
  }

  async isCookieUidValid(): Promise<boolean> {
    const cookie = this.getCookie('van-vliet');
    if (!cookie) return false;
    const uid = JSON.parse(cookie);
    const docSnap = await getDoc(doc(this.db, 'users', uid.uid));
    return docSnap.exists();
  }
}
