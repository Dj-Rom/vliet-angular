import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: any = null;

  isInstallable = signal<boolean>(false);
  isInstalled = signal<boolean>(false);
  isIos = signal<boolean>(false);
  isOpenModal = signal<boolean>(false);

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Detect Standalone (already installed / opened as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalled.set(isStandalone);

    // Detect iOS / iPadOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    this.isIos.set(isApple);

    // Capture Android / Chrome PWA install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable.set(true);

      // Auto show modal if not previously dismissed
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed && !this.isInstalled()) {
        this.isOpenModal.set(true);
      }
    });

    // Detect when successfully installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.isOpenModal.set(false);
      this.deferredPrompt = null;
    });

    // If iOS and not installed and not dismissed, show prompt
    if (isApple && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        // Small delay to let app load
        setTimeout(() => {
          if (!this.isInstalled()) {
            this.isOpenModal.set(true);
          }
        }, 1500);
      }
    }
  }

  openInstallPrompt(): void {
    this.isOpenModal.set(true);
  }

  closeModal(): void {
    this.isOpenModal.set(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  }

  async install(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        this.isInstalled.set(true);
        this.isOpenModal.set(false);
      }
      this.deferredPrompt = null;
    }
  }
}
