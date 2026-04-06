import { Component } from '@angular/core';
import { MoreMenuService } from '../../../../core/services/more-menu.service';
import { ModalService } from '../../../../core/services/modal.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-more-menu-waybill',
  imports: [],
  templateUrl: './more-menu-waybill.html',
  styleUrl: './more-menu-waybill.css',
})
export class MoreMenuWaybill {
  id = '';

  constructor(
    protected moreMenuService: MoreMenuService,
    private modalService: ModalService,
    private alert: AlertService,
  ) {
    this.id = this.moreMenuService.id;
  }

  async onDelete(id: string) {
    try {
      const isSure = await this.modalService.openSureModal();

      if (isSure) {
        this.moreMenuService.deleteWaybill(id);
      }
    } catch (e) {
      this.alert.show('error', e!.toString() || '');
    }
  }

  editWaybill(id: string) {
    this.moreMenuService.editWaybill(id);
  }

  protected readonly window = window;
}
