import { Component } from '@angular/core';
import { PackakingModalService } from '../packaking-modal.service';
import { KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { MoreMenuService } from '../../../../core/services/more-menu.service';

@Component({
  selector: 'app-packaking-list-modal',
  standalone: true,
  imports: [NgForOf, KeyValuePipe, NgIf],
  templateUrl: './packaking-list-modal.html',
  styleUrl: './packaking-list-modal.css',
})
export class PackakingListModal {
  constructor(
    protected pMService: PackakingModalService,
    private moreMenuService: MoreMenuService,
  ) {}

  get isListEmpty(): boolean {
    const values = Object.values(this.pMService.list() || {});
    if (values.length === 0) return true;
    return values.every((v) => Number(v) === 0);
  }

  sendPackaging = () => {
    const targetId = this.pMService.id() || this.pMService.date();
    this.moreMenuService.sendToWhatsApp(targetId);
    this.pMService.closeModalAndClear();
  };

  protected readonly alert = alert;
}
