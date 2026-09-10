import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewClientModal } from './modal/view-client-modal';
import { AddLocationModalService } from '../../core/services/add-location-modal.service';
import { NgIf } from '@angular/common';
import { LoadLocationService } from '../../core/services/load-location.service';

import { Router } from '@angular/router';

@Component({
  selector: 'app-load-location',
  standalone: true,
  imports: [ViewClientModal, NgIf],
  templateUrl: './load-location.html',
  styleUrls: ['./load-location.css'],
})
export class LoadLocation implements OnInit, OnDestroy {
  constructor(
    public loadLocationService: LoadLocationService,
    public modalService: AddLocationModalService,
    private router: Router,
  ) {}

  goToPlClients(): void {
    this.router.navigate(['/app/klienty-pl']);
  }

  async ngOnInit(): Promise<void> {
    await this.loadLocationService.init();
  }

  ngOnDestroy(): void {
    this.loadLocationService.stopRealtimeSync();
  }
}
