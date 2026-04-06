import { Injectable, signal } from '@angular/core';
import { _Alert } from '../../shared/alert/alert';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private messageSignal = signal('');
  private typeSignal = signal<'success' | 'error'>('error');
  private showSignal = signal(false);

  /** Expose for template binding */
  isShow = () => this.showSignal();
  getMessage = () => this.messageSignal();
  getType = () => this.typeSignal();

  constructor() {}

  /** Show alert with automatic hide */
  show(type: 'success' | 'error', message: string, duration = 3000) {
    this.typeSignal.set(type);
    this.messageSignal.set(message);
    this.showSignal.set(true);

    // Auto-hide after duration
    setTimeout(() => this.showSignal.set(false), duration);
  }

  /** Manually hide alert */
  hide() {
    this.showSignal.set(false);
  }
}
