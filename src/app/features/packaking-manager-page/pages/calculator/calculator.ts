import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { ListService } from '../../../../core/services/load-calculator-services/load-calculator.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
})
export class Calculator {
  key!: string;

  history = signal('');
  currentInput = signal('0');

  isEdit = false;
  editId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private listService: ListService,
  ) {
    this.init();
  }

  private init() {
    this.key = decodeURIComponent(this.route.snapshot.paramMap.get('key') || '');

    this.editId = this.listService.editListId() || null;
    this.isEdit = !!this.editId;

    if (this.isEdit && this.editId) {
      const list = this.listService.savedLists()[this.editId];
      const value = list?.value[this.key] ?? 0;
      this.currentInput.set(String(value));
    } else {
      const value = this.listService.currentList().value[this.key] ?? 0;
      this.currentInput.set(String(value));
    }
  }

  /* ================= BUTTONS ================= */

  btnClick(event: Event) {
    const value = (event.target as HTMLElement).innerText;
    const current = this.currentInput();
    const last = current.slice(-1);
    const operators = '+-×÷';

    if (operators.includes(value) && operators.includes(last)) return;

    if (current === '0' && value !== '.') {
      this.currentInput.set(value);
      return;
    }

    this.currentInput.set(current + value);
  }

  btnClear() {
    this.currentInput.set('0');
    this.history.set('');
  }

  btnBackspace() {
    const val = this.currentInput();
    this.currentInput.set(val.length > 1 ? val.slice(0, -1) : '0');
  }

  calculate() {
    const expression = this.currentInput().replace(/×/g, '*').replace(/÷/g, '/');

    try {
      const result = Function(`"use strict"; return (${expression})`)();
      this.history.set(this.currentInput());
      this.currentInput.set(String(result));
    } catch {
      this.currentInput.set('Error');
    }
  }

  /* ================= SAVE ================= */

  enter() {
    const value = Number(this.currentInput());

    if (Number.isNaN(value)) return;

    if (this.isEdit && this.editId) {
      const list = this.listService.savedLists()[this.editId];
      if (!list) return;

      this.listService.updateSavedList(this.editId, {
        ...list,
        value: {
          ...list.value,
          [this.key]: value,
        },
      });

      this.router.navigate(['app/load-management/edit', this.editId]);
    } else {
      this.listService.addToList(this.key, value);
      this.router.navigate(['app/load-management/add']);
    }
  }

  back() {
    this.location.back();
  }
}
