import { Injectable, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ListService, ListItem } from './load-calculator-services/load-calculator.service';
import { Router } from '@angular/router';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { AlertService } from './alert.service';
import { WaybillsService } from '../../features/waybiils/services/waybills.service';
import { LoadLocationService } from './load-location.service';
import { AddLocationModalService } from './add-location-modal.service';

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
    private location: Location,
    private loadLocationService: LoadLocationService,
    private addLocationModalService: AddLocationModalService,
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

  private formatListItemMessage(id?: string): string {
    const editId = id || this.listService.editListId() || this.date;
    if (editId) {
      const lists = this.listService.savedLists();
      const item: ListItem = lists[editId];
      if (item) {
        let message = `${item.name} ${item.date}\n Załadowane:`;
        for (const key of Object.keys(item.value || {})) {
          if (item.value[key] > 0) {
            message += `\n${key}: ${item.value[key]}`;
          }
        }
        return message.trim();
      }
    }

    // Format current list (e.g. on /app/load-management/add)
    const current = this.listService.currentList();
    const company = this.listService.getCurrentCompanyName() || current.name || '';
    let message = `${company || 'Lista ładunkowa'}\nZaładowane:`;
    let hasItems = false;
    for (const key of Object.keys(current.value || {})) {
      if (current.value[key] > 0) {
        message += `\n${key}: ${current.value[key]}`;
        hasItems = true;
      }
    }
    return hasItems ? message.trim() : '';
  }

  sendToWhatsApp(id?: string) {
    const message = this.formatListItemMessage(id);
    if (!message) {
      this.alert.show('error', 'Brak towaru do wysłania');
      this.closeMenu();
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMenu();
  }

  sendToNumber(id: string, phoneNumber: string) {
    const message = this.formatListItemMessage(id);
    if (!message) {
      this.alert.show('error', 'Brak towaru do wysłania');
      this.closeMenu();
      return;
    }
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMenu();
  }

  deleteListItem(id?: string) {
    const targetId = id || this.listService.editListId() || this.date;
    if (targetId) {
      const deleted = this.listService.deleteSavedList(targetId);
      if (deleted) {
        this.closeMenu();
        this.alert.show('success', 'Usunięto pomyślnie');
        return this.listService.savedLists();
      }
    }

    // Reset current working list (e.g. on /add page)
    this.listService.resetList();
    this.closeMenu();
    this.alert.show('success', 'Zresetowano listę');
    return this.listService.savedLists();
  }

  async deleteWaybill(id: string) {
    try {
      if (this.router.url.includes('/app/waybill-new')) {
        await this.fb.deleteWayBillHistory(id);
        this.waybillService.waybills.update((list) => list.filter((w) => w.id !== id));
      } else if (this.router.url.includes('/app/load-location')) {
        await this.fb.deleteSharedAddress(id);
        this.loadLocationService.listAddress.update((list) => list.filter((a) => a.id !== id));
        this.loadLocationService.filteredListAddress.update((list) => list.filter((a) => a.id !== id));
        this.addLocationModalService.close();
      }

      this.closeWaybillMoreMenu();
      this.closeClientMoreMenu();
      this.alert.show('success', 'Usunięto pomyślnie');
    } catch (error) {
      this.alert.show('error', `Błąd podczas usuwania: ${error}`);
      this.closeWaybillMoreMenu();
      this.closeClientMoreMenu();
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
    this.addLocationModalService.close();
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
