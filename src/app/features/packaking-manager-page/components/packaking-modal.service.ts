import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PackakingModalService{
  isOpenModal = signal(false);
  title = signal('');
  date = signal('');
  list = signal([]);
  constructor() {

  }
  getItemAndShowModal(title: string, dateOrId: string, item?: any){
    this.isOpenModal.set(true);
    this.title.set(title);
    this.date.set(item?.date || dateOrId);
    if (item && item.value) {
      this.list.set(item.value);
      return;
    }
    const lists: any = JSON.parse(<string>localStorage.getItem('lists') || '{}');
    if (lists) {
      if (lists[dateOrId]) {
        this.list.set(lists[dateOrId].value);
      } else {
        const found = Object.values(lists).find(
          (l: any) => l.id === dateOrId || l.date === dateOrId,
        ) as any;
        if (found) {
          this.list.set(found.value);
        }
      }
    }
  }
  isActive(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.classList.toggle('active');
  }
  closeModalAndClear(){
    this.title.set('');
    this.date.set('');
    this.list.set([]);
    this.isOpenModal.set(false);
  }
}
