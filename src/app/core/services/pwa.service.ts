import { Injectable, signal } from '@angular/core';

export type PwaPlatform = 'ios-safari' | 'ios-other' | 'android' | 'desktop';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: any = null;

  isInstallable = signal<boolean>(false);
  isInstalled = signal<boolean>(false);
  platform = signal<PwaPlatform>('android');
  selectedPlatformTab = signal<PwaPlatform>('android');
  isOpenModal = signal<boolean>(false);

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Detect Standalone (already installed / running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalled.set(isStandalone);

    // Detect OS & Browser
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    const isAndroid = /android/.test(ua);

    if (isApple) {
      // Check if Safari or other browser (Chrome CriOS, Firefox FxiOS, Opera OPiOS)
      const isOtherBrowser = /crios|fxios|opios|edgios/.test(ua) || !/safari/.test(ua);
      const plat: PwaPlatform = isOtherBrowser ? 'ios-other' : 'ios-safari';
      this.platform.set(plat);
      this.selectedPlatformTab.set('ios-safari');
    } else if (isAndroid) {
      this.platform.set('android');
      this.selectedPlatformTab.set('android');
    } else {
      this.platform.set('desktop');
      this.selectedPlatformTab.set('desktop');
    }

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

    // If on iOS and not installed and not dismissed, show prompt with slight delay
    if (isApple && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          if (!this.isInstalled()) {
            this.isOpenModal.set(true);
          }
        }, 1500);
      }
    }
  }

  openInstallPrompt(): void {
    // Reset tab to detected platform when opening
    const curr = this.platform();
    this.selectedPlatformTab.set(curr === 'ios-other' ? 'ios-safari' : curr);
    this.isOpenModal.set(true);
  }

  setPlatformTab(tab: PwaPlatform): void {
    this.selectedPlatformTab.set(tab);
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
