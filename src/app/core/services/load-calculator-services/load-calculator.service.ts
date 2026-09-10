import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { AlertService } from '../alert.service';
import { FirebaseClientService } from '../../../firebase/firebase.service';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';

export interface ListItem {
  id?: string;
  name: string;
  date: string;
  value: Record<string, number>;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ListService implements OnDestroy {
  /* ================= STATE ================= */

  editListId = signal('');
  currentCompanyName = signal('');
  filterValue = signal('');
  isLoading = signal(false);
  isLiveSyncing = signal(false);

  private readonly LIST_KEY = 'list';
  private readonly LISTS_KEY = 'lists';
  private unsubscribeSnapshot?: () => void;
  private authUnsubscribe?: Unsubscribe;
  private hasMigratedLocalLists = false;

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
      '555': 0,
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
    const rawFilter = (this.filterValue() || '').trim();

    if (!rawFilter) return { ...all };

    const filterUpper = rawFilter.toUpperCase();
    const normalizedFilter = filterUpper.replace(/[\s\-_/]/g, '');

    return Object.keys(all)
      .filter((k) => {
        const keyUpper = k.toUpperCase();
        const keyNormalized = keyUpper.replace(/[\s\-_/]/g, '');
        return keyUpper.includes(filterUpper) || (normalizedFilter.length > 0 && keyNormalized.includes(normalizedFilter));
      })
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

  constructor(
    private alert: AlertService,
    private fb: FirebaseClientService,
  ) {
    this.restoreCurrentList();
    this.setupAuthListener();
  }

  ngOnDestroy() {
    this.stopRealtimeSync();
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  private setupAuthListener() {
    this.authUnsubscribe = onAuthStateChanged(this.fb.auth, (user) => {
      if (user) {
        this.startRealtimeSync();
      } else {
        this.stopRealtimeSync();
      }
    });
  }

  /* ================= REALTIME SYNC (Firestore) ================= */

  startRealtimeSync(): void {
    if (this.unsubscribeSnapshot) return;

    const currentCached = this.readSavedLists();
    if (Object.keys(currentCached).length === 0) {
      this.isLoading.set(true);
    }

    this.isLiveSyncing.set(true);
    this.unsubscribeSnapshot = this.fb.subscribeToPackageHistory(
      (firestoreData: any[]) => {
        this.isLoading.set(false);

        const listsMap: Record<string, ListItem> = {};
        for (const item of firestoreData) {
          const key = item.id || item.date;
          listsMap[key] = {
            id: item.id,
            name: item.name || '',
            date: item.date || '',
            value: item.value || {},
            createdAt: item.createdAt,
          };
        }

        // Merge with existing local-only lists if any (preserve offline unsaved data)
        const localLists = this.readSavedLists();
        for (const [localKey, localItem] of Object.entries(localLists)) {
          const existsInFirebase = Object.values(listsMap).some(
            (fbItem) => fbItem.id === localKey || fbItem.id === localItem.id || fbItem.date === localItem.date,
          );
          if (!existsInFirebase) {
            listsMap[localKey] = localItem;
          }
        }

        localStorage.setItem(this.LISTS_KEY, JSON.stringify(listsMap));
        this.listsVersion.update((v) => v + 1);

        // Auto-migrate local lists to Firestore once
        if (!this.hasMigratedLocalLists) {
          this.hasMigratedLocalLists = true;
          this.migrateLocalListsToFirebase(firestoreData);
        }
      },
      (error) => {
        console.warn('Realtime package history sync error:', error);
        this.isLoading.set(false);
        this.isLiveSyncing.set(false);
      },
    );
  }

  stopRealtimeSync(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = undefined;
      this.isLiveSyncing.set(false);
    }
  }

  private async migrateLocalListsToFirebase(firestoreData: any[]) {
    const localLists = this.readSavedLists();
    const existingDatesAndIds = new Set(
      firestoreData.flatMap((d) => [d.id, d.date].filter(Boolean)),
    );

    for (const [key, item] of Object.entries(localLists)) {
      if (!existingDatesAndIds.has(key) && !existingDatesAndIds.has(item.id) && !existingDatesAndIds.has(item.date)) {
        try {
          const newDocId = await this.fb.addNewPackageList(item);
          if (newDocId) {
            item.id = newDocId;
          }
        } catch (e) {
          console.warn('Could not auto-migrate list to Firebase:', e);
        }
      }
    }
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

  /* ================= CRUD ACTIONS ================= */

  updateSavedList(id: string, updated: ListItem) {
    const lists = this.readSavedLists();
    let targetKey = id;

    if (!lists[targetKey]) {
      const foundKey = Object.keys(lists).find(
        (k) => lists[k].id === id || lists[k].date === id,
      );
      if (foundKey) targetKey = foundKey;
    }

    if (!lists[targetKey]) {
      this.alert.show('error', 'List not found');
      return;
    }

    lists[targetKey] = {
      ...lists[targetKey],
      name: updated.name || lists[targetKey].name,
      value: { ...updated.value },
    };

    this.saveSavedLists(lists);

    const fbDocId = lists[targetKey].id || targetKey;
    this.fb.updatePackageHistory(fbDocId, lists[targetKey]).catch((err) => {
      console.warn('Failed to update package in Firebase:', err);
    });
  }

  deleteSavedList(id: string): boolean {
    const lists = this.readSavedLists();
    let targetKey = id;

    if (!lists[targetKey]) {
      const foundKey = Object.keys(lists).find(
        (k) => lists[k].id === id || lists[k].date === id,
      );
      if (foundKey) targetKey = foundKey;
    }

    if (lists[targetKey]) {
      const itemToDelete = lists[targetKey];
      delete lists[targetKey];
      localStorage.setItem(this.LISTS_KEY, JSON.stringify(lists));
      this.listsVersion.update((v) => v + 1);

      const fbDocId = itemToDelete.id || targetKey;
      this.fb.deletePackageHistory(fbDocId).catch((err) => {
        console.warn('Failed to delete package from Firebase:', err);
      });
      return true;
    }
    return false;
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

    const dateStr = this.formatDate(new Date());
    const updated: ListItem = {
      ...this.list(),
      name: this.getCurrentCompanyName(),
      date: dateStr,
    };

    const lists = this.readSavedLists();
    lists[dateStr] = updated;
    this.saveSavedLists(lists);
    this.alert.show('success', 'Saved!');
    this.resetList();

    // Persist to Firebase in background
    this.fb.addNewPackageList(updated).then((newDocId) => {
      if (newDocId) {
        updated.id = newDocId;
        const currentLists = this.readSavedLists();
        currentLists[newDocId] = updated;
        if (newDocId !== dateStr && currentLists[dateStr]) {
          delete currentLists[dateStr];
        }
        localStorage.setItem(this.LISTS_KEY, JSON.stringify(currentLists));
        this.listsVersion.update((v) => v + 1);
      }
    }).catch((err) => {
      console.warn('Error saving package list to Firebase:', err);
    });

    return dateStr;
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
