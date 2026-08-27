import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install-modal.html',
  styleUrls: ['./pwa-install-modal.css'],
})
export class PwaInstallModal {
  constructor(public pwaService: PwaService) {}

  install(): void {
    this.pwaService.install();
  }

  close(): void {
    this.pwaService.closeModal();
  }
}
