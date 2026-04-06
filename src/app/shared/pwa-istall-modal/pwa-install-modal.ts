import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-pwa-install',
  templateUrl: './pwa-install-modal.html',
  imports: [NgIf],
  styleUrls: ['./pwa-install-modal.css'],
})
export class PwaInstallModal implements OnInit {
  constructor(private alert: AlertService) {}
  deferredPrompt: any = null;
  showInstallButton = signal(false);
  isIos = false;
  isInStandaloneMode = false;

  ngOnInit() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIos = /iphone|ipad|ipod/.test(userAgent);

    this.isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (this.isIos && !this.isInStandaloneMode) {
      this.showInstallButton.set(true);
    }

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault(); // powstrzymaj automatyczny prompt
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });
  }

  installPwa() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        this.alert.show('success', `User accepted the A2HS prompt`);
      } else {
        this.alert.show('error', `User dismissed the A2HS prompt`);
      }
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
    });
  }
}
