import {Component} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {KeyValuePipe, NgForOf} from '@angular/common';
import {ListItem, ListService} from '../../../services/load-calculator-services/load-calculator-service';
import {FormsModule} from '@angular/forms';

import {BehaviorSubject} from 'rxjs';
import {AlertService} from '../../../services/alert.service';
import {_Alert} from '../../alert/alert';

@Component({
  selector: 'app-edit-item',
  imports: [
    KeyValuePipe,
    NgForOf,
    FormsModule,
    RouterLink,
    _Alert,
  ],
  templateUrl: './edit-item.html',
  styleUrls: ['./edit-item.css', './../add-new-list/add-new-list.css'],
})
export class EditItem {
  id = '';
  companyName
  private _list$ = new BehaviorSubject<ListItem | null>(null);
  readonly list$ = this._list$.asObservable();

  constructor(private router: Router, private listService: ListService, private alert: AlertService) {

    this.id = decodeURIComponent(this.router.url.split('/')[4]);

    const saved = this.listService.getSavedLists()[ this.id];

    this.companyName = saved['name'];
    if (saved) {
      this._list$.next({ ...saved });
    } else {
      console.error('List not found for ID:', this.id);
    }
  }

  // Safe getter
  get list(): ListItem {
    return this._list$.value!;
  }

  onCompanyNameInput(event: any) {
    const updated = {
      ...this.list,
      name: event.target.value
    };
    this._list$.next(updated);
  }

  addToList(key: string, value: number) {
    const updated: ListItem = {
      ...this.list,
      value: {
        ...this.list.value,
        [key]: value
      }
    };

    this._list$.next(updated);

  }

  async doneSaveEdit()
    {
      if (!this.companyName.trim()) {
        let inp = document.querySelector('.item-info') as HTMLInputElement;
        inp.classList.add('error-active');
        this.alert.show('error', 'Please fill company name');
        inp.addEventListener('focusin', () => inp.classList.remove('error-active'));
        return;
      }
    this.listService.updateSavedLists(this.list)
  }

increment(key: string) {

    const next = (this.list?.value[key] ?? 0) + 1;
  this.addToList(key, next);
  }

  decrement(key: string) {
    const next = Math.max(0, (this.list?.value[key] ?? 0) - 1);
    this.addToList(key, next);
  }

  calculator() {

  }
}
