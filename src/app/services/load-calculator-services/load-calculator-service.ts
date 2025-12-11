import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {AlertService} from '../alert.service';
import {Router} from '@angular/router';

export interface ListItem {
  name: string;
  date: string;
  value: { [key: string]: number };
}

@Injectable({
  providedIn: 'root',
})
export class ListService {

  private initialItemList: ListItem = {
    name: "",
    date: "",
    value: {
      'TAG-6': 0, 'TAG-5': 0, 'CC': 0, 'CC-SH': 0, 'EXT': 0,
      'NC': 0, 'KK': 0, 'KK-SH': 0, 'PALLETA': 0, 'EUROPALLETA': 0,
      '520': 0, '533/544': 0, '560': 0, '566': 0, '577': 0,
      '588': 0, '595': 0, '596': 0, '597': 0, '598': 0,
      'TRAAY': 0, 'OTHER': 0
    }
  };

  private _list$ = new BehaviorSubject<ListItem>({...this.initialItemList});
  readonly list$ = this._list$.asObservable();

  listChanged$ = new BehaviorSubject<void>(undefined);

  private currentCompanyName = "";

  constructor(private alert: AlertService, private router: Router) {
    const saved = localStorage.getItem('list');
    if (saved) {
      try {
        this._list$.next(JSON.parse(saved));
      } catch {
        this._list$.next({...this.initialItemList});
      }
    }
  }

  getCurrentList(): ListItem {
    return {...this._list$.value};
  }

  setList(newList: ListItem) {
    this._list$.next({...newList});
    this.saveList();
  }

  getSavedLists(): Record<string, ListItem> {
    return JSON.parse(localStorage.getItem('lists') || '{}');
  }

  updateSavedLists(newList: ListItem) {
    try {
      const lists = this.getSavedLists();
      let currentList = {
        [newList['date']]: newList
      }
      Object.assign(lists, currentList);
      localStorage.setItem('lists', JSON.stringify(lists));
      this.alert.show('success', 'Saved!');
      this.router.navigate(['app/load-management/all']);
    } catch {
      this.alert.show('error', 'Error saving list');
    }


  }

  addToList(key: string, value: number) {
    if (value < 0) return;

    const updated: ListItem = {
      ...this._list$.value,
      value: {...this._list$.value.value, [key]: value}
    };

    this._list$.next(updated);
    this.saveList();
  }

  resetList() {
    this._list$.next({...this.initialItemList});
    this.currentCompanyName = "";
    this.saveList();
  }

  saveList() {
    localStorage.setItem('list', JSON.stringify(this._list$.value));
  }

  setCurrentCompanyName(name: string): boolean {
    if (!name.trim()) return false;
    this.currentCompanyName = name;
    return true;
  }
  getCurrentCompanyName(): string {
    return this.currentCompanyName;
  }

  onDone() {
    if (!this.currentCompanyName?.trim()) {
      this.alert.show('error', 'Please fill company name');
      return;
    }

    const updatedList = {
      ...this._list$.value,
      name: this.currentCompanyName,
      date: this.formatDate(new Date())
    };

    const newEntry = {[updatedList.date]: updatedList};

    const storage: Record<string, ListItem> =
      JSON.parse(localStorage.getItem('lists') || '{}');

    localStorage.setItem('lists', JSON.stringify({
      ...storage,
      ...newEntry
    }));

    this.resetList();
    this.listChanged$.next();

    const companyNameInput =
      document.querySelector<HTMLInputElement>('#inputAddNewListCompanyName');

    if (companyNameInput) companyNameInput.value = "";

    this.alert.show('success', 'Saved!');
  }

  filterList(filter: string): { [key: string]: number } {
    const all = this._list$.value.value;
    if (!filter) return {...all};

    const upper = filter.toUpperCase();
    return Object.keys(all)
      .filter(k => k.includes(upper))
      .reduce((acc, k) => ({...acc, [k]: all[k]}), {});
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date) + ' - ' +
      date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
  }
}
