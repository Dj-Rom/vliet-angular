import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KlientPlService, PolishClient } from '../../core/services/klient-pl.service';
import { ViewKlientPlModal } from './modal/view-klient-pl-modal';
import { AddKlientPlModal } from './modal/add-klient-pl-modal';

@Component({
  selector: 'app-klienty-pl',
  standalone: true,
  imports: [CommonModule, ViewKlientPlModal, AddKlientPlModal],
  templateUrl: './klienty-pl.html',
  styleUrls: ['./klienty-pl.css'],
})
export class KlientyPlComponent {
  constructor(
    public klientService: KlientPlService,
    private router: Router,
  ) {}

  goToUeClients(): void {
    this.router.navigate(['/app/load-location']);
  }

  onCardClick(client: PolishClient, event: MouseEvent): void {
    // If user clicked directly on one of the quick action buttons, don't open modal
    const target = event.target as HTMLElement;
    if (target.closest('.card-action-btn') || target.closest('a')) {
      return;
    }
    this.klientService.openClient(client);
  }

  quickCall(client: PolishClient, event: Event): void {
    event.stopPropagation();
    this.klientService.callClient(client);
  }

  quickSms(client: PolishClient, event: Event): void {
    event.stopPropagation();
    this.klientService.sendArrivalSms(client);
  }

  quickNav(client: PolishClient, event: Event): void {
    event.stopPropagation();
    this.klientService.navigateClient(client);
  }
}
