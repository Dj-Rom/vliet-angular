import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { FirebaseClientService } from '../app/firebase/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private fb: FirebaseClientService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    // Сначала проверяем UID в cookie
    const cookieUid = this.fb.getCookie('van-vliet');
    if (cookieUid) {
      const isValid = await this.fb.isCookieUidValid();
      console.log(isValid);
      if (isValid) {
        return true;
      }
    }


    const currentUser = this.fb.currentUser();
    if (currentUser?.uid) {
      return true; // пользователь залогинен → пропускаем
    }

    // Ни cookie, ни Firebase Auth → редирект на login
    return this.router.createUrlTree(['/auth/sign-in']);
  }
}
