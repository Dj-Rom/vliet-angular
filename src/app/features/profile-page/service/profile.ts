import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  isOpenModalName = signal(false);
}
