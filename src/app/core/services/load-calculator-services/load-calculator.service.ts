import { Injectable, signal, computed } from '@angular/core';
import { AlertService } from '../alert.service';

export interface ListItem {
  name: string;
  date: string;
  value: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class ListService {
  updateSavedList(id: string, updated: ListItem) {
    const lists = this.readSavedLists();
    if (!lists[id]) {
      this.alert.show('error', 'List not found');
      return;
    }

    lists[id] = {
      ...lists[id],
      value: { ...updated.value },
    };

    this.saveSavedLists(lists);
  }

  /* ================= STATE ================= */

  editListId = signal('');
  currentCompanyName = signal('');
  filterValue = signal('');

  private readonly LIST_KEY = 'list';
  private readonly LISTS_KEY = 'lists';

  private readonly initialItemList: ListItem = {
    name: '',
    date: '',
    value: {
      'TAG-6': 0,
      'TAG-5': 0,
      CC: 0,
      'CC-SH': 0,
      EXT: 0,
      NC: 0,
      KK: 0,
      'KK-SH': 0,
      PALLETA: 0,
      EUROPALLETA: 0,
      '520': 0,
      '533/544': 0,
      '560': 0,
      '566': 0,
      '577': 0,
      '588': 0,
      '595': 0,
      '596': 0,
      '597': 0,
      '598': 0,
      TRAAY: 0,
      OTHER: 0,
    },
  };

  private list = signal<ListItem>(this.initialItemList);

  /* ================= COMPUTED ================= */

  currentList = computed(() => ({
    ...this.list(),
    value: { ...this.list().value },
  }));

  filteredList = computed<Record<string, number>>(() => {
    const all = this.list().value;
    const filter = this.filterValue().toUpperCase();

    if (!filter) return { ...all };

    return Object.keys(all)
      .filter((k) => k.includes(filter))
      .reduce((acc, k) => ({ ...acc, [k]: all[k] }), {} as Record<string, number>);
  });

  private listsVersion = signal(0);

  savedLists = computed<Record<string, ListItem>>(() => {
    this.listsVersion();
    return this.readSavedLists();
  });
  notifyListChanged() {
    this.listsVersion.update((v) => v + 1);
  }

  /* ================= INIT ================= */

  constructor(private alert: AlertService) {
    this.restoreCurrentList();
  }

  private restoreCurrentList() {
    const saved = localStorage.getItem(this.LIST_KEY);
    if (!saved) return;

    try {
      this.list.set(JSON.parse(saved));
    } catch {
      this.list.set({ ...this.initialItemList });
    }
  }

  /* ================= MUTATIONS ================= */

  setFilter(value: string) {
    this.filterValue.set(value);
  }

  setCurrentCompanyName(name: string) {
    this.currentCompanyName.set(name);
    localStorage.setItem('currentCompanyName', JSON.stringify(name));
  }

  getCurrentCompanyName(): string {
    return (
      this.currentCompanyName() || JSON.parse(localStorage.getItem('currentCompanyName') || '""')
    );
  }

  addToList(key: string, value: number) {
    if (value < 0) return;

    this.list.update((list) => ({
      ...list,
      value: {
        ...list.value,
        [key]: value,
      },
    }));

    this.saveCurrentList();
  }

  resetList() {
    this.list.set({ ...this.initialItemList });
    this.setCurrentCompanyName('');
    this.saveCurrentList();
  }

  /* ================= STORAGE ================= */

  private saveCurrentList() {
    localStorage.setItem(this.LIST_KEY, JSON.stringify(this.list()));
  }

  private readSavedLists(): Record<string, ListItem> {
    try {
      return JSON.parse(localStorage.getItem(this.LISTS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private saveSavedLists(lists: Record<string, ListItem>) {
    localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
    this.listsVersion.update((v) => v + 1);
    this.resetList();
  }

  /* ================= FINAL SAVE ================= */

  onDone(): string | void {
    if (!this.getCurrentCompanyName().trim()) {
      this.alert.show('error', 'Please fill company name');
      return;
    }

    const updated: ListItem = {
      ...this.list(),
      name: this.getCurrentCompanyName(),
      date: this.formatDate(new Date()),
    };

    const lists = this.readSavedLists();
    lists[updated.date] = updated;
    this.saveSavedLists(lists);
    this.alert.show('success', 'Saved!');
    this.resetList();
    return updated.date;
  }

  /* ================= UTILS ================= */

  formatDate(date: Date): string {
    return (
      new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date) +
      ' - ' +
      date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }
}
