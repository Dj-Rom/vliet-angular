import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AppCookieService {

  constructor(private cookieService: CookieService) { }

  /** Save a cookie */
  setCookie(name: string, value: string, days: number = 7): void {
    this.cookieService.set(name, value, days, '/'); // '/' makes it available site-wide
  }

  /** Get a cookie */
  getCookie(name: string): string | null {
    const value = this.cookieService.get(name);
    return value ? value : null;
  }

  /** Delete a specific cookie */
  deleteCookie(name: string): void {
    this.cookieService.delete(name, '/');
  }

  /** Check if a cookie exists */
  checkCookie(name: string): boolean {
    return this.cookieService.check(name);
  }

  /** Clear all cookies */
  clearAllCookies(): void {
    this.cookieService.deleteAll('/');
  }
}
