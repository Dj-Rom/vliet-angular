import {Component, inject, OnInit} from '@angular/core';
import {FirebaseClientService, SharedAddress} from '../../firebase/firebase.service';
import {ModalWindow} from './modal-window/modal-window';
import {ModalService} from './modal-window/modal.service';
import {RouterLink} from '@angular/router';


@Component({
  selector: 'app-load-location',
  standalone: true,
  imports: [
    ModalWindow,
    RouterLink
  ],
  templateUrl: './load-location.html',
  styleUrls: ['./load-location.css']
})
export class LoadLocation implements OnInit {
  listAddress: SharedAddress[] = [];

  constructor(private fb: FirebaseClientService,public modalService: ModalService) {}


  async ngOnInit(): Promise<void> {
    try {
      this.listAddress = await this.fb.getSharedAddresses();
      console.log('📦 Addresses loaded:', this.listAddress);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }


  protected readonly ModalService = ModalService;
  protected readonly navigator = navigator;
}
