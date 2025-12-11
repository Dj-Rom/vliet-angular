import { Injectable } from '@angular/core';
import { ListService, ListItem } from '../load-calculator-services/load-calculator-service';

import { BehaviorSubject } from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MoreMenuService {

  private isActive = false;
  isOpenMenuChanged$ = new BehaviorSubject<void>(undefined);

  constructor(private listService: ListService, private router: Router) {}

  setIsOpenMoreMenu() {
    this.isActive = true;
    this.isOpenMenuChanged$.next();

  }

  closeMoreMenu() {
    this.isActive = false;
    this.isOpenMenuChanged$.next();
  }

  getIsActiveMoreMenu(): boolean {
    return this.isActive;
  }

  formatListItemMessage(id: string): string {
    const item = this.listService.getSavedLists()[id];
    let message = `Name: ${item.name}\nDate: ${item.date}\n\nValues:\n`;

    for (const key of Object.keys(item.value)) {
      if (item.value[key] > 0) {
        message += `${key}: ${item.value[key]}\n`;
      }
    }

    return message.trim();
  }

  sendToWhatsApp(id: string): void {
    const message = this.formatListItemMessage(id);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMoreMenu();
  }

  sendToNumber(id: string, phoneNumber: string): void {
    const message = this.formatListItemMessage(id);
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.closeMoreMenu();
  }

  deleteListItem(id: string): Record<string, ListItem> {
    const lists = this.listService.getSavedLists();
    delete lists[id];
    localStorage.setItem('lists', JSON.stringify(lists));

    this.listService.listChanged$.next();
    this.closeMoreMenu();
    return lists;
  }

  editListItem(id: string) {
    this.router.navigate(['app/load-management/edit', id]);
  }

}
