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
  getItemAndShowModal(title: string, date: string){
    this.isOpenModal.set(true);
    this.title.set(title);
    this.date.set(date);
   let lists: any = JSON.parse(<string>localStorage.getItem('lists'));
   this.list.set(lists[date].value);


  }
  isActive(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.classList.toggle('active');
  }
  closeModalAndClear(){
    this.title.set('');
    this.date.set('');
    this.isOpenModal.set(false);
  }
}
