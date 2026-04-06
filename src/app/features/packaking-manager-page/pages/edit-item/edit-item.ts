import { Component, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import {
  ListItem,
  ListService,
} from '../../../../core/services/load-calculator-services/load-calculator.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoadCalculatorItemComponent } from '../../../../shared/load-calculator-item-component/load-calculator-item-component';
import { MoreMenuService } from '../../../../core/services/more-menu.service';
import { PackagingHeaderWithFilter } from '../../components/header/packaging-header/packaging-header-with-filter';

@Component({
  selector: 'app-edit-item',
  standalone: true,
  imports: [FormsModule, LoadCalculatorItemComponent, PackagingHeaderWithFilter],
  templateUrl: './edit-item.html',
  styleUrls: ['./edit-item.css'],
})
export class EditItem implements OnDestroy {
  submitted = false;

  companyName = signal('');
  list = signal<ListItem | null>(null);

  private readonly editId: string | null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    protected listService: ListService,
    private alert: AlertService,
    private moreMenuService: MoreMenuService,
  ) {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (!this.editId) return;

    const saved = this.listService.savedLists()[this.editId];
    this.listService.editListId.set(this.editId);

    if (saved) {
      // local state
      this.companyName.set(saved.name);
      this.list.set({ ...saved });

      // push into service writable signal
      this.listService['list'].set({ ...saved });
      this.listService.setCurrentCompanyName(saved.name);
    }
  }

  ngOnDestroy() {
    this.listService.editListId.set('');
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
    this.router.navigate(['/app/load-management/calc', key]);
  }

  doneSaveEdit() {
    this.submitted = true;

    if (!this.companyName().trim()) {
      this.alert.show('error', 'Please fill company name');
      return;
    }

    const current = this.list();
    if (!current || !this.editId) return;
    const name = `${this.companyName()}  ${this.companyName().includes('zaktualizowano') ? '' : ' zaktualizowano'},`;
    const updated: ListItem = {
      ...current,
      name: name,
    };

    this.listService.updateSavedList(this.editId, updated);
    this.alert.show('success', 'Zapisane!');
    this.router.navigate(['/app/load-management/all']);
  }

  back() {
    this.location.back();
  }

  openMenu() {
    this.moreMenuService.toggleMenu();
  }

  protected readonly Object = Object;
}
