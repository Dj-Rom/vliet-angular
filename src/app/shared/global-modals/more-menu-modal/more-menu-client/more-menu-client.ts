import { Component } from '@angular/core';
import { MoreMenuService } from '../../../../core/services/more-menu.service';
import { ModalService } from '../../../../core/services/modal.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-more-menu-client',
  imports: [],
  templateUrl: './more-menu-client.html',
  styleUrl: '../more-menu-modal.css',
})
export class MoreMenuClient {
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
        await this.moreMenuService.deleteWaybill(id);
      }
    } catch (error) {
      this.alert.show('error', `Error:, ${error}`);
    }
  }

  protected editClient(id: string) {
    this.moreMenuService.editClient(id);
  }
}
