import { Component, OnInit, signal, effect, OnDestroy } from '@angular/core';
import { FirebaseClientService, SharedAddress } from '../../firebase/firebase.service';
import { ViewClientModal } from './modal/view-client-modal';
import { AddLocationModalService } from '../../core/services/add-location-modal.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { LoadLocationService } from '../../core/services/load-location.service';

@Component({
  selector: 'app-load-location',
  standalone: true,
  imports: [ViewClientModal, NgIf],
  templateUrl: './load-location.html',
  styleUrls: ['./load-location.css'],
})
export class LoadLocation implements OnInit {
  constructor(
    public loadLocationService: LoadLocationService,
    public modalService: AddLocationModalService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadLocationService.init();
  }
}
