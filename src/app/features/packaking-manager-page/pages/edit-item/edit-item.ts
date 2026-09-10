import { Component, OnDestroy, effect, signal, HostListener } from '@angular/core';
import { Router, RouterLink, ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import {
  ListItem,
  ListService,
} from '../../../../core/services/load-calculator-services/load-calculator.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoadCalculatorItemComponent } from '../../../../shared/load-calculator-item-component/load-calculator-item-component';
import { MoreMenuService } from '../../../../core/services/more-menu.service';
import { ModalService } from '../../../../core/services/modal.service';
import { PackagingHeaderWithFilter } from '../../components/header/packaging-header/packaging-header-with-filter';
import { CanComponentDeactivate } from '../../../../core/guard/pending-changes.guard';

@Component({
  selector: 'app-edit-item',
  standalone: true,
  imports: [FormsModule, LoadCalculatorItemComponent, PackagingHeaderWithFilter],
  templateUrl: './edit-item.html',
  styleUrls: ['./edit-item.css'],
})
export class EditItem implements OnDestroy, CanComponentDeactivate {
  submitted = false;

  companyName = signal('');
  list = signal<ListItem | null>(null);

  private editId: string | null = null;
  private isSaved = false;
  private initialName: string | null = null;
  private initialValues: Record<string, number> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    protected listService: ListService,
    private alert: AlertService,
    private moreMenuService: MoreMenuService,
    private modalService: ModalService,
  ) {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.listService.editListId.set(this.editId);
    }

    // If returning from calculator and listService already holds current items
    const existingDraft = this.listService.currentList();
    if (
      existingDraft &&
      this.listService.editListId() === this.editId &&
      this.listService.getCurrentCompanyName()
    ) {
      if (this.initialName === null) {
        this.initialName = this.listService.getCurrentCompanyName();
        this.initialValues = { ...existingDraft.value };
      }
      this.companyName.set(this.listService.getCurrentCompanyName());
      this.list.set({ ...existingDraft });
    }

    effect(() => {
      if (!this.editId || this.list()) return;
      const all = this.listService.savedLists();
      let saved: ListItem | undefined = all[this.editId];
      if (!saved) {
        saved = Object.values(all).find((l) => l.id === this.editId || l.date === this.editId);
        if (saved && saved.id) {
          this.editId = saved.id;
          this.listService.editListId.set(saved.id);
        }
      }

      if (saved) {
        if (this.initialName === null) {
          this.initialName = saved.name;
          this.initialValues = { ...saved.value };
        }
        this.companyName.set(saved.name);
        this.list.set({ ...saved });
        this.listService['list'].set({ ...saved });
        this.listService.setCurrentCompanyName(saved.name);
      }
    });

    // React to company name changes from ListService (e.g. changed via modal)
    effect(() => {
      const svcName = this.listService.currentCompanyName();
      if (svcName && this.list() && svcName !== this.companyName()) {
        this.companyName.set(svcName);
      }
    });

    // Sync draft list changes (e.g. returning from calculator)
    effect(() => {
      const currentDraft = this.listService.currentList();
      const local = this.list();
      if (this.editId && currentDraft?.value && local) {
        if (JSON.stringify(local.value) !== JSON.stringify(currentDraft.value)) {
          this.list.set({
            ...local,
            value: { ...currentDraft.value },
          });
        }
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.returnValue = true;
    }
  }

  private hasUnsavedChanges(): boolean {
    if (this.isSaved) return false;

    const currentName = this.listService.getCurrentCompanyName() || this.companyName();
    const nameChanged = this.initialName !== null && currentName !== this.initialName;

    const currentVals = this.listService.currentList().value || this.list()?.value;
    const valuesChanged =
      this.initialValues !== null &&
      currentVals &&
      JSON.stringify(currentVals) !== JSON.stringify(this.initialValues);

    return nameChanged || !!valuesChanged;
  }

  async canDeactivate(nextState?: RouterStateSnapshot): Promise<boolean> {
    if (this.isSaved) return true;
    if (nextState?.url.includes('/calc')) return true;

    if (!this.hasUnsavedChanges()) {
      this.listService.editListId.set('');
      this.listService.resetList();
      return true;
    }

    const confirmed = await this.modalService.openSureModal('Czy na pewno chcesz wyjść bez zapisania?');
    if (confirmed) {
      this.listService.editListId.set('');
      this.listService.resetList();
      return true;
    }
    return false;
  }

  ngOnDestroy() {
    if (!this.router.url.includes('/calc')) {
      this.listService.editListId.set('');
      this.listService.resetList();
    }
  }

  increment(key: string) {
    const current = this.list();
    if (!current) return;

    const next = (current.value[key] ?? 0) + 1;

    // update local state
    this.list.set({
      ...current,
      value: { ...current.value, [key]: next },
    });

    // update service state
    this.listService.addToList(key, next);
  }

  decrement(key: string) {
    const current = this.list();
    if (!current) return;

    const next = Math.max(0, (current.value[key] ?? 0) - 1);

    this.list.set({
      ...current,
      value: { ...current.value, [key]: next },
    });

    this.listService.addToList(key, next);
  }

  calculator(key: string) {
    this.router.navigate(['/app/load-management/calc', key], {
      queryParams: this.editId ? { editId: this.editId } : {},
    });
  }

  doneSaveEdit() {
    this.submitted = true;

    const currentName = (this.listService.getCurrentCompanyName() || this.companyName() || '').trim();
    if (!currentName) {
      this.alert.show('error', 'Please fill company name');
      return;
    }

    const current = this.list();
    if (!current || !this.editId) return;

    const baseName = currentName.replace(/\s*zaktualizowano\s*$/i, '').trim();
    const finalName = `${baseName}  zaktualizowano`;

    const currentValues = this.listService.currentList().value || current.value;
    const updated: ListItem = {
      ...current,
      name: finalName,
      value: { ...currentValues },
    };

    this.isSaved = true;
    this.listService.updateSavedList(this.editId, updated);
    this.alert.show('success', 'Zapisane!');

    this.listService.editListId.set('');
    this.listService.resetList();

    this.router.navigate(['/app/load-management/all']);
  }

  back() {
    this.router.navigate(['/app/load-management/all']);
  }

  openMenu() {
    this.moreMenuService.toggleMenu();
  }

  protected readonly Object = Object;
}
