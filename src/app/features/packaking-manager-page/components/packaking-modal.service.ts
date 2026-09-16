import { Injectable, signal } from '@angular/core';
import { ListService } from '../../../core/services/load-calculator-services/load-calculator.service';

@Injectable({
  providedIn: 'root',
})
export class PackakingModalService {
  isOpenModal = signal(false);
  title = signal('');
  date = signal('');
  id = signal('');
  item = signal<any>(null);
  list = signal<Record<string, number>>({});

  constructor(private listService: ListService) {}

  getItemAndShowModal(title: string, dateOrId: string, item?: any): void {
    this.isOpenModal.set(true);
    this.title.set(title);
    this.date.set(item?.date || dateOrId);
    this.id.set(item?.id || dateOrId);

    if (item && item.value) {
      this.item.set(item);
      this.list.set(item.value);
      return;
    }

    const lists = this.listService.savedLists();
    let found = lists[dateOrId];
    if (!found) {
      found = Object.values(lists).find(
        (l: any) => l.id === dateOrId || l.date === dateOrId,
      ) as any;
    }

    if (found) {
      this.item.set(found);
      if (found.name) this.title.set(found.name);
      if (found.date) this.date.set(found.date);
      if (found.id) this.id.set(found.id);
      this.list.set(found.value || {});
    }
  }

  isActive(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.classList.toggle('active');
  }

  closeModalAndClear(): void {
    this.title.set('');
    this.date.set('');
    this.id.set('');
    this.item.set(null);
    this.list.set({});
    this.isOpenModal.set(false);
  }
}
