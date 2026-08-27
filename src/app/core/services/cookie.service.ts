import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AppCookieService {
  constructor(private cookieService: CookieService) {}

  /** Save a cookie */
  setCookie(name: string, value: string, days = 7): void {
    try {
      this.cookieService.set(name, value, days, '/'); // '/' makes it available site-wide
    } catch (e) {
      console.warn(`Could not set cookie ${name}:`, e);
    }
  }

  /** Get a cookie */
  getCookie(name: string): string | null {
    try {
      const value = this.cookieService.get(name);
      return value ? value : null;
    } catch {
      return null;
    }
  }

  /** Save JSON object to cookie */
  setJson<T>(name: string, value: T, days = 7): void {
    try {
      const serialized = JSON.stringify(value);
      this.setCookie(name, serialized, days);
    } catch (e) {
      console.warn(`Could not serialize JSON for cookie ${name}:`, e);
    }
  }

  /** Get JSON object from cookie */
  getJson<T>(name: string): T | null {
    try {
      const val = this.getCookie(name);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  /** Delete a specific cookie */
  deleteCookie(name: string): void {
    try {
      this.cookieService.delete(name, '/');
    } catch (e) {
      console.warn(`Could not delete cookie ${name}:`, e);
    }
  }

  /** Check if a cookie exists */
  checkCookie(name: string): boolean {
    try {
      return this.cookieService.check(name);
    } catch {
      return false;
    }
  }

  /** Clear all cookies */
  clearAllCookies(): void {
    try {
      this.cookieService.deleteAll('/');
    } catch (e) {
      console.warn('Could not delete all cookies:', e);
    }
  }
}
