import { Injectable, signal } from '@angular/core';
import { ListService, ListItem } from './load-calculator-services/load-calculator.service';
import { Router } from '@angular/router';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { AlertService } from './alert.service';
import { WaybillsService } from '../../features/waybiils/services/waybills.service';

@Injectable({
  providedIn: 'root',
})
export class MoreMenuService {
  isOpenClientMoreMenu = signal(false);
  isOpenWaybillMoreMenu = signal(false);
  isOpen = signal(false);
  title = '';
  date = '';
  id = '';

  constructor(
    private waybillService: WaybillsService,
    private listService: ListService,
    private router: Router,
    private fb: FirebaseClientService,
    private alert: AlertService,
  ) { }

  toggleWaybillMoreMenu() {
    this.isOpenWaybillMoreMenu.set(!this.isOpen());
  }

  closeWaybillMoreMenu() {
    this.isOpenWaybillMoreMenu.set(false);
  }
  toggleClientMoreMenu() {
    this.isOpenClientMoreMenu.set(!this.isOpen());
  }

  closeClientMoreMenu() {
    this.isOpenClientMoreMenu.set(false);
  }

  toggleMenu() {
    this.isOpen.set(!this.isOpen());
  }

  closeMenu() {
    this.isOpen.set(false);
  }

  private formatListItemMessage(id: string): string {
    const lists = this.listService.savedLists();
    const item: ListItem = lists[id];
    if (!item) return '';
    let message = `${item.name} ${item.date}\nLoad:`;
    for (const key of Object.keys(item.value)) {
      if (item.value[key] > 0) {
        message += `\n${key}: ${item.value[key]}`;
      }
    }
    return message.trim();
  }

  sendToWhatsApp(id: string) {
    const message = this.formatListItemMessage(id);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMenu();
  }

  sendToNumber(id: string, phoneNumber: string) {
    const message = this.formatListItemMessage(id);
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMenu();
  }

  deleteListItem(id: string) {
    const lists = this.listService.savedLists(); // zamiast getSavedLists()
    delete lists[id];
    localStorage.setItem('lists', JSON.stringify(lists));
    this.listService.notifyListChanged();
    this.closeMenu();
    return lists;
  }

  async deleteWaybill(id: string) {
    try {
      if (this.router.url == '/app/waybill-new') {
        await this.fb.deleteWayBillHistory(id);
        this.waybillService.waybills.update((list) => list.filter((w) => w.id !== id));
      } else if (this.router.url == '/app/load-location') {
        await this.fb.deleteSharedAddress(id);
      }

      this.closeWaybillMoreMenu();
      this.closeClientMoreMenu();
      this.alert.show('success', 'Waybill deleted successfully');
    } catch (error) {
      this.alert.show('error', `Error deleting waybill: ${error}`);
      this.closeWaybillMoreMenu();
    }
  }

  editListItem(id?: string) {
    if (!id) {
      this.alert.show('error', 'editListItem called without id!');
      return;
    }
    this.router.navigate(['app/load-management/edit', id]);
    this.closeMenu();
  }

  editWaybill(id: string) {
    this.router.navigate(['app/waybill-new/edit', id]);
    this.closeWaybillMoreMenu();
  }
  editClient(id: string) {
    this.router.navigate(['app/load-location/edit', id]);
    this.closeClientMoreMenu();
  }

  openMenu(title: string, date: string) {
    this.title = title;
    this.date = date;
    this.toggleMenu();
  }
  openWaybillMoreMenu(id: string) {
    this.id = id;
    this.toggleWaybillMoreMenu();
  }
  openClientMoreMenu(id: string) {
    this.id = id;
    this.toggleClientMoreMenu();
  }
}
