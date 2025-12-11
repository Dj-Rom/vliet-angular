import { Injectable } from '@angular/core';
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
  User
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { _VehicleFleet, _WillBill } from '../data/vehicle-fleet-number';
import {validate} from '@angular/forms/signals';
export interface SharedAddress { id: string; company: string; address: string; google_link: string; gps: string; notes?: string; }

// Init Firebase
const app = initializeApp(environment.firebase);
const auth = getAuth(app);
const db = getFirestore(app);

@Injectable({ providedIn: 'root' })
export class FirebaseClientService {

  private auth = auth;
  private db = db;
  private user: User | null = null;
  private uid: string | null = null;
  constructor() {
    onAuthStateChanged(this.auth, (u) => this.user = u);
    if(this.getCookie('van-vliet')){
      this.uid = this.getCookie('van-vliet')
    }
  }

  // -------------------------------
  // 🔐 AUTH SECTION
  // -------------------------------

  /** Register new user */
  async signUp(email: string, password: string, fullName: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await setDoc(doc(this.db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      fullName,
      createdAt: new Date().toISOString()
    });
    return cred.user;
  }

  /** Login and optionally save UID in cookie */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    this.user = cred.user;

    if (rememberMe && this.user?.uid) {
      this.setCookie('van-vliet', JSON.stringify(this.user), 7);

    }

    return cred.user;
  }

  /** Sign out */
  async signOutUser(): Promise<void> {
    await signOut(this.auth);
    this.user = null;
    this.deleteCookie('van-vliet');

  }

  /** Check if logged in */
  isLoggedIn(): Promise<boolean> {
    return new Promise(res => {
      const unsub = onAuthStateChanged(this.auth, (user) => {
        res(!!user);
        unsub();
      });
    });
  }

  /** Get current user */
  currentUser() {
    return this.auth.currentUser;
  }

  getUserEmail() {
    return this.user?.email || null;
  }

  // -------------------------------
  // 👤 PROFILE SECTION
  // -------------------------------

  async updateUserName(fullName: string) {
    if (!this.auth.currentUser) return;
    await updateProfile(this.auth.currentUser, { displayName: fullName });
    await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), { fullName });
  }

  async updateUserEmail(email: string) {
    if (!this.auth.currentUser) return;
    await updateEmail(this.auth.currentUser, email);
    await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), { email });
  }

  async updateUserPassword(newPassword: string) {
    if (!this.auth.currentUser) return;
    await updatePassword(this.auth.currentUser, newPassword);
  }

  async deleteUserAccount(): Promise<void> {
    if (!this.auth.currentUser) return;
    await deleteDoc(doc(this.db, 'users', this.auth.currentUser.uid));
    await deleteUser(this.auth.currentUser);
    this.user = null;
    this.deleteCookie('van-vliet');
    this.deleteCookie('van-vliet-email');
  }

  // -------------------------------
  // 📁 USER DATA
  // -------------------------------

  async saveUserData(uid: string, data: Record<string, any>) {
    await setDoc(doc(this.db, 'users', uid), data, { merge: true });
  }

  async getUserData(uid: string) {
    const snap = await getDoc(doc(this.db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  }

  // -------------------------------
  // 🏢 SHARED ADDRESSES
  // -------------------------------

  async getSharedAddresses(): Promise<SharedAddress[]> {
    try {
      const snap = await getDocs(collection(this.db, 'shared_addresses'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedAddress));
    } catch (e) {
      console.error('Failed to fetch shared addresses', e);
      return [];
    }
  }

  async addAddress(company: string, address: string, google_link: string, gps: string, notes: string) {
    const ref = doc(collection(this.db, 'shared_addresses'));
    await setDoc(ref, { company, address, google_link, gps, notes, createdAt: new Date().toISOString() });
  }

  async updateSharedAddress(id: string, data: any) {
    await updateDoc(doc(this.db, 'shared_addresses', id), data);
  }

  async deleteSharedAddress(id: string) {
    await deleteDoc(doc(this.db, 'shared_addresses', id));
  }

  // -------------------------------
  // 🚚 VEHICLE FLEET
  // -------------------------------

  async getVehicleFleet(): Promise<_VehicleFleet[]> {
    const snap = await getDocs(collection(this.db, 'vehicle_fleet'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as _VehicleFleet));
  }

  async addVehicleFleet(vehicle_number: string, type: string, brand: string) {
    const ref = doc(collection(this.db, 'vehicle_fleet'));
    await setDoc(ref, { vehicle_number, type, brand, createdAt: new Date().toISOString() });
  }

  async updateVehicleFleet(id: string, data: any) {
    await updateDoc(doc(this.db, 'vehicle_fleet', id), data);
  }

  async deleteVehicleFleet(id: string) {
    await deleteDoc(doc(this.db, 'vehicle_fleet', id));
  }
  // -------------------------------
  // 📄 PACKAGE HISTORY
  // -------------------------------
  async getPackageHistory(): Promise<_WillBill[]> {
    if (!this.auth.currentUser?.uid) return [];

    const uid = this.auth.currentUser.uid;
    const snap = await getDocs(
      collection(this.db, "users", uid, "packageHistory")
    );

    let res = snap.docs.map(d => ({ id: d.id, ...d.data() } as _WillBill));
    return res;
  }
  async addNewPackageList(data: any) {
    if (!this.auth.currentUser?.uid) return;

    const uid = this.auth.currentUser.uid;
    const ref = doc(collection(this.db, "users", uid, "packageHistory"));

    await setDoc(ref, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
  async updatePackageHistory(id: string, data: any) {
    if (!this.auth.currentUser?.uid) return;

    const uid = this.auth.currentUser.uid;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(
      doc(this.db, "users", uid, "packageHistory", id),
      cleanData
    );
  }
  async deletePackageHistory(id: string) {
    if (!this.auth.currentUser?.uid) return;

    const uid = this.auth.currentUser.uid;
    await deleteDoc(
      doc(this.db, "users", uid, "packageHistory", id)
    );
  }


  // -------------------------------
  // 📄 WAYBILL HISTORY
  // -------------------------------

  async getWillBillsHistory(): Promise<_WillBill[]> {
    if (!this.auth.currentUser?.uid) return [];
    console.log(this.auth.currentUser.uid)
    const snap = await getDocs(collection(this.db, this.auth.currentUser.uid));

    let res = snap.docs.map(d => ({ id: d.id, ...d.data() } as _WillBill));
    return res;
  }

  async addInfoForCurrentUser(data: any) {
    if (!this.auth.currentUser?.uid) return;
    const ref = doc(collection(this.db, this.auth.currentUser.uid));
    await setDoc(ref, { ...data, createdAt: new Date().toISOString() });
  }

  async updateWayBillsHistory(id: string, data: any) {
    if (!this.auth.currentUser?.uid) return;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await updateDoc(doc(this.db, this.auth.currentUser.uid, id), cleanData);
  }

  async deleteWayBillHistory(id: string) {
    if (!this.auth.currentUser?.uid) return;
    await deleteDoc(doc(this.db, this.auth.currentUser.uid, id));
  }

  // -------------------------------
  // 🍪 COOKIE SECTION (client-side "remember me")
  // -------------------------------

  /** Set cookie */
  setCookie(name: string, value: string, days: number = 7) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
  }

  /** Get cookie */
  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }

  /** Delete cookie */
  deleteCookie(name: string) {
    this.setCookie(name, '', -1);
  }


  /** Check if cookie UID is valid in Firestore */
  async isCookieUidValid():Promise<boolean>  {
    const uid = JSON.parse(this.getCookie('van-vliet')!);
    if (!uid) return false;
    const docSnap = await getDoc(doc(this.db, 'users', uid.uid));
    return docSnap.exists();
  }

}
