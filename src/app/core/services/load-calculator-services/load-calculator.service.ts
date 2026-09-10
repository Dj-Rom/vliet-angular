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

  private readonly LIST_KEY_PREFIX = 'package_list_current_';
  private readonly LISTS_KEY_PREFIX = 'package_lists_';
  private unsubscribeSnapshot?: () => void;
  private authUnsubscribe?: Unsubscribe;
  private currentUid: string | null = null;

  private getListsKey(): string {
    const uid = this.currentUid || this.fb.getCurrentUid();
    return uid ? `${this.LISTS_KEY_PREFIX}${uid}` : `${this.LISTS_KEY_PREFIX}guest`;
  }

  private getCurrentListKey(): string {
    const uid = this.currentUid || this.fb.getCurrentUid();
    return uid ? `${this.LIST_KEY_PREFIX}${uid}` : `${this.LIST_KEY_PREFIX}guest`;
  }

  private getCompanyNameKey(): string {
    const uid = this.currentUid || this.fb.getCurrentUid();
    return uid ? `package_company_${uid}` : 'package_company_guest';
  }

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
    // Clear legacy unscoped cache to prevent cross-account pollution
    try {
      localStorage.removeItem('lists');
    } catch {}

    this.currentUid = this.fb.getCurrentUid();
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
      this.stopRealtimeSync();

      if (user) {
        this.currentUid = user.uid;
        this.restoreCurrentList();
        this.currentCompanyName.set(this.getCurrentCompanyName());
        this.listsVersion.update((v) => v + 1);
        this.startRealtimeSync();
      } else {
        this.currentUid = null;
        // User logged out: strictly clear active state so nothing leaks to the next user
        this.list.set({ ...this.initialItemList });
        this.currentCompanyName.set('');
        this.listsVersion.update((v) => v + 1);
      }
    });
  }

  /* ================= REALTIME SYNC (Firestore) ================= */

  startRealtimeSync(): void {
    if (this.unsubscribeSnapshot) return;
    const uid = this.currentUid || this.fb.getCurrentUid();
    if (!uid) return;

    const currentCached = this.readSavedLists();
    if (Object.keys(currentCached).length === 0) {
      this.isLoading.set(true);
    }

    this.isLiveSyncing.set(true);
    this.unsubscribeSnapshot = this.fb.subscribeToPackageHistory(
      (firestoreData: any[]) => {
        this.isLoading.set(false);

        // Map Firestore data strictly for this authenticated user
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

        // Save strictly to this user's scoped cache
        localStorage.setItem(this.getListsKey(), JSON.stringify(listsMap));
        this.listsVersion.update((v) => v + 1);
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

  private restoreCurrentList() {
    const saved = localStorage.getItem(this.getCurrentListKey());
    if (!saved) {
      this.list.set({ ...this.initialItemList });
      return;
    }

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
    localStorage.setItem(this.getCompanyNameKey(), JSON.stringify(name));
  }

  getCurrentCompanyName(): string {
    return (
      this.currentCompanyName() ||
      JSON.parse(localStorage.getItem(this.getCompanyNameKey()) || '""')
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
      ...updated,
      id: lists[targetKey].id || id,
    };

    this.saveSavedLists(lists);
    this.alert.show('success', 'Zaktualizowano pomyślnie!');

    // Background Firebase update under users/{uid}/packageHistory
    const docId = lists[targetKey].id || id;
    this.fb.updatePackageHistory(docId, lists[targetKey]).catch((err) => {
      console.warn('Error updating package list in Firebase:', err);
    });
  }

  deleteSavedList(id: string): boolean {
    const lists = this.readSavedLists();
    let keyToDelete = id;

    if (!lists[keyToDelete]) {
      const foundKey = Object.keys(lists).find(
        (k) => lists[k].id === id || lists[k].date === id,
      );
      if (foundKey) keyToDelete = foundKey;
    }

    if (lists[keyToDelete]) {
      const docId = lists[keyToDelete]?.id || keyToDelete;
      delete lists[keyToDelete];
      this.saveSavedLists(lists);
      this.alert.show('success', 'Usunięto pomyślnie!');

      // Background Firebase deletion under users/{uid}/packageHistory
      if (docId) {
        this.fb.deletePackageHistory(docId).catch((err) => {
          console.warn('Error deleting package list from Firebase:', err);
        });
      }
      return true;
    }
    return false;
  }

  /* ================= STORAGE ================= */

  private saveCurrentList() {
    localStorage.setItem(this.getCurrentListKey(), JSON.stringify(this.list()));
  }

  private readSavedLists(): Record<string, ListItem> {
    const uid = this.currentUid || this.fb.getCurrentUid();
    if (!uid) {
      return {};
    }
    try {
      return JSON.parse(localStorage.getItem(this.getListsKey()) || '{}');
    } catch {
      return {};
    }
  }

  private saveSavedLists(lists: Record<string, ListItem>) {
    localStorage.setItem(this.getListsKey(), JSON.stringify(lists));
    this.listsVersion.update((v) => v + 1);
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

    // Persist to Firebase in background under users/{uid}/packageHistory
    this.fb.addNewPackageList(updated).then((newDocId) => {
      if (newDocId) {
        updated.id = newDocId;
        const currentLists = this.readSavedLists();
        currentLists[newDocId] = updated;
        if (newDocId !== dateStr && currentLists[dateStr]) {
          delete currentLists[dateStr];
        }
        this.saveSavedLists(currentLists);
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
