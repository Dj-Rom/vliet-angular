import { Component } from '@angular/core';
import {PackakingModalService} from '../packaking-modal.service';
import {KeyValuePipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-packaking-list-modal',
  imports: [
    NgForOf,
    KeyValuePipe,
    NgIf
  ],
  templateUrl: './packaking-list-modal.html',
  styleUrl: './packaking-list-modal.css',
})
export class PackakingListModal {
constructor(
  protected pMService: PackakingModalService
) {}

  get isListEmpty(): boolean {
    return Object.values(this.pMService.list()).every(v => v === 0);
  }

  protected readonly alert = alert;
}
