import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { ModalService } from '../../../../core/services/modal.service';
import { MoreMenuService } from '../../../../core/services/more-menu.service';

@Component({
  selector: 'app-item-waybill',
  imports: [NgIf],
  standalone: true,
  templateUrl: './item-waybill.html',
  styleUrl: './item-waybill.css',
})
export class ItemWaybill {
  @Input() item: any;
  constructor(private modalService: MoreMenuService) {}
  openMoreMenu() {
    this.modalService.openWaybillMoreMenu(this.item.id);
  }
}
