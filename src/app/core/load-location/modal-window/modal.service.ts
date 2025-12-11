import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {SharedAddress} from '../../../firebase/firebase.service';


@Injectable({ providedIn: 'root' })
export class ModalService {
  client$ = new BehaviorSubject<SharedAddress | null>(null);
  isOpen$ = new BehaviorSubject<boolean>(false);

  open(client: SharedAddress) {
    this.client$.next(client);
    this.isOpen$.next(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

  }

  close() {
    this.isOpen$.next(false);
    this.client$.next(null);
    document.body.style.overflow = 'auto';
  }
}
