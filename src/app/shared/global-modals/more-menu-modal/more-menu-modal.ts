import { Component } from '@angular/core';
import { MoreMenuService } from '../../../core/services/more-menu.service';
import { ListService, ListItem } from '../../../core/services/load-calculator-services/load-calculator.service';
import { ModalService } from '../../../core/services/modal.service';
import { AlertService } from '../../../core/services/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-more-menu',
  standalone: true,
  imports: [],
  templateUrl: './more-menu-modal.html',
  styleUrl: './more-menu-modal.css',
})
export class MoreMenuModal {
  constructor(
    protected moreMenuService: MoreMenuService,
    private modalService: ModalService,
    private alert: AlertService,
    private listService: ListService,
    protected router: Router,
  ) {}

  get title(): string {
    return this.moreMenuService.title || this.listService.getCurrentCompanyName() || 'Wpisz nazwę';
  }

  get date(): string {
    return this.moreMenuService.date;
  }

  hasItemsToSend(): boolean {
    const editId = this.moreMenuService.date || this.listService.editListId();
    if (editId) {
      const lists = this.listService.savedLists();
      let item: ListItem | undefined = lists[editId];
      if (!item) {
        item = Object.values(lists).find(
          (l) => l.id === editId || l.date === editId,
        );
      }
      if (item && item.value) {
        return Object.values(item.value).some((v) => Number(v) > 0);
      }
    }

    const current = this.listService.currentList();
    if (current && current.value) {
      return Object.values(current.value).some((v) => Number(v) > 0);
    }
    return false;
  }

  async onDelete(id?: string) {
    try {
      const targetId = id || this.moreMenuService.date || this.listService.editListId();
      const isSure = await this.modalService.openSureModal();
      if (isSure) {
        this.moreMenuService.deleteListItem(targetId);
        this.router.navigate(['/app/load-management/all']);
      } else {
        this.moreMenuService.closeMenu();
      }
    } catch (e) {
      this.alert.show('error', e!.toString() || '');
      this.moreMenuService.closeMenu();
    }
  }

  onSend(id?: string) {
    const targetId = id || this.moreMenuService.date;
    this.moreMenuService.sendToWhatsApp(targetId);
  }

  edit(id?: string) {
    const targetId = id || this.moreMenuService.date;
    this.moreMenuService.editListItem(targetId);
  }

  protected readonly window = window;

  changeFileName() {
    this.moreMenuService.closeMenu();
    this.modalService.openNameModal(false);
  }
}
