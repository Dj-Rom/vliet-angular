import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService, PwaPlatform } from '../../core/services/pwa.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-modal.html',
  styleUrls: ['./pwa-install-modal.css'],
})
export class PwaInstallModal {
  constructor(
    public pwaService: PwaService,
    private alert: AlertService,
  ) {}

  install(): void {
    this.pwaService.install();
  }

  close(): void {
    this.pwaService.closeModal();
  }

  setTab(tab: PwaPlatform): void {
    this.pwaService.setPlatformTab(tab);
  }

  copyLink(): void {
    try {
      navigator.clipboard.writeText('https://dj-rom.github.io/vliet-angular/');
      this.alert.show('success', 'Skopiowano link do schowka! Wklej go w Safari.');
    } catch {
      this.alert.show('error', 'Nie udało się skopiować linku.');
    }
  }
}
