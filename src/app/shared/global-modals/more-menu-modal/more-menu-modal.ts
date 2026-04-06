import { Component } from '@angular/core';
import { MoreMenuService } from '../../../core/services/more-menu.service';
import { AddNewList } from '../../../features/packaking-manager-page/pages/add-new-list/add-new-list';
import { ModalService } from '../../../core/services/modal.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-more-menu',
  imports: [],
  templateUrl: './more-menu-modal.html',
  styleUrl: './more-menu-modal.css',
  providers: [AddNewList],
})
export class MoreMenuModal {
  date = '';
  title = 'Enter the name';

  constructor(
    protected moreMenuService: MoreMenuService,
    private modalService: ModalService,
    private alert: AlertService,
  ) {
    this.title = this.moreMenuService.title;
    this.date = this.moreMenuService.date;
  }

  async onDelete(id: string) {
    try {
      const isSure = await this.modalService.openSureModal();
      if (isSure) {
        this.moreMenuService.deleteListItem(id);
      }
    } catch (e) {
      this.alert.show('error', e!.toString() || '');
    }
  }

  onSend(id: string) {
    this.moreMenuService.sendToWhatsApp(id);
  }

  edit(id: string) {
    this.moreMenuService.editListItem(id);
  }

  protected readonly window = window;

  changeFileName() {
    this.modalService.openNameModal(false);
  }
}
