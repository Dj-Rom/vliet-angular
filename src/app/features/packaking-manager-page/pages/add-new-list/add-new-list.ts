import { Component, Signal, signal, inject, computed } from '@angular/core';
import { NgForOf, NgIf, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ListItem,
  ListService,
} from '../../../../core/services/load-calculator-services/load-calculator.service';
import { AppStateService } from '../../../../core/services/app-state.service';
import { ModalService } from '../../../../core/services/modal.service';
import { PackagingHeaderWithFilter } from '../../components/header/packaging-header/packaging-header-with-filter';

@Component({
  selector: 'app-add-new-list',
  standalone: true,
  imports: [NgForOf, NgIf, KeyValuePipe, FormsModule, PackagingHeaderWithFilter],
  templateUrl: './add-new-list.html',
  styleUrls: ['./add-new-list.css'],
})
export class AddNewList {
  /* ===== DEPENDENCIES ===== */

  private readonly listService = inject(ListService);
  private readonly appService = inject(AppStateService);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);

  /* ===== SIGNALS ===== */

  readonly currentList = computed<ListItem>(() => this.listService.currentList());

  readonly filteredList = computed<Record<string, number>>(() => this.listService.filteredList());

  isOpenInformation = signal(false);
  informationUrl = signal('');

  constructor() {
    this.modalService.openNameModal();
  }

  /* ===== ACTIONS ===== */

  increment(key: string) {
    const next = (this.currentList().value[key] ?? 0) + 1;
    this.listService.addToList(key, next);
  }

  decrement(key: string) {
    const next = Math.max(0, (this.currentList().value[key] ?? 0) - 1);
    this.listService.addToList(key, next);
  }

  resetList() {
    this.listService.resetList();
  }

  save() {
    if (!this.listService.getCurrentCompanyName()?.trim()) {
      this.modalService.openNameModal();
      return;
    }

    this.listService.onDone();

    this.router.navigate(['/app/load-management/']);
  }

  calculator(key: string) {
    this.router.navigate(['/app/load-management/calc', key]);
  }

  openInformation(key: string) {
    const map: Record<string, string> = {
      CC: 'assets/packages/cc.png',
      KK: 'assets/packages/kk.png',
      NC: 'assets/packages/nc.png',
      'TAG-5': 'assets/packages/tag-5.png',
      'TAG-6': 'assets/packages/tag-6.png',
      'KK-SH': 'assets/packages/kk-sh.png',
      'CC-SH': 'assets/packages/cc-sh.png',
      EUROPALLETA: 'assets/packages/palleta-euro.png',
    };

    if (map[key]) {
      this.informationUrl.set(map[key]);
      this.isOpenInformation.set(true);
    }
  }
}
