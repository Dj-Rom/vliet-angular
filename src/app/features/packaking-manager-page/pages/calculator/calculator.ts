import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { ListService } from '../../../../core/services/load-calculator-services/load-calculator.service';
import { AlertService } from '../../../../core/services/alert.service';

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

  // разрешаем только цифры, точку и операторы +-×÷ (защита от произвольного кода в Function())
  private readonly EXPRESSION_REGEX = /^[0-9+\-×÷.]+$/;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private listService: ListService,
    private alert: AlertService,
  ) {
    this.init();
  }

  private init() {
    try {
      const rawKey = this.route.snapshot.paramMap.get('key');

      if (!rawKey) {
        this.alert.show('error', 'Nie znaleziono klucza parametru.');
        this.currentInput.set('0');
        this.key = '';
        return;
      }

      try {
        this.key = decodeURIComponent(rawKey);
      } catch (e) {
        console.error('Failed to decode key param:', e);
        this.alert.show('error', 'Nieprawidłowy format klucza.');
        this.key = rawKey;
      }

      this.editId = this.listService.editListId() || null;
      this.isEdit = !!this.editId;

      if (this.isEdit && this.editId) {
        const savedLists = this.listService.savedLists();
        const list = savedLists ? savedLists[this.editId] : undefined;

        if (!list) {
          this.alert.show('error', 'Nie znaleziono edytowanej listy.');
          this.currentInput.set('0');
          return;
        }

        const value = list.value?.[this.key] ?? 0;
        this.currentInput.set(this.safeToString(value));
      } else {
        const currentList = this.listService.currentList();
        const value = currentList?.value?.[this.key] ?? 0;
        this.currentInput.set(this.safeToString(value));
      }
    } catch (e) {
      console.error('Calculator init failed:', e);
      this.alert.show('error', 'Wystąpił błąd podczas inicjalizacji kalkulatora.');
      this.currentInput.set('0');
    }
  }

  private safeToString(value: unknown): string {
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : '0';
  }

  /* ================= BUTTONS ================= */

  btnClick(event: Event) {
    try {
      const target = event.target as HTMLElement | null;
      const value = target?.innerText?.trim();

      if (!value) {
        console.warn('btnClick: no value on target');
        return;
      }

      const current = this.currentInput();
      const last = current.slice(-1);
      const operators = '+-×÷';

      // сброс состояния ошибки при новом вводе
      if (current === 'Error') {
        this.currentInput.set(operators.includes(value) ? '0' + value : value);
        return;
      }

      // не даём поставить два оператора подряд
      if (operators.includes(value) && operators.includes(last)) return;

      // не даём поставить точку, если она уже есть в текущем числе
      if (value === '.' && this.hasDecimalInCurrentNumber(current)) return;

      if (current === '0' && value !== '.') {
        this.currentInput.set(value);
        return;
      }

      this.currentInput.set(current + value);
    } catch (e) {
      console.error('btnClick failed:', e);
      this.alert.show('error', 'Błąd podczas wprowadzania wartości.');
    }
  }

  private hasDecimalInCurrentNumber(current: string): boolean {
    const lastSegment = current.split(/[+\-×÷]/).pop() ?? '';
    return lastSegment.includes('.');
  }

  btnClear() {
    this.currentInput.set('0');
    this.history.set('');
  }

  btnBackspace() {
    try {
      const val = this.currentInput();
      if (val === 'Error') {
        this.currentInput.set('0');
        return;
      }
      this.currentInput.set(val.length > 1 ? val.slice(0, -1) : '0');
    } catch (e) {
      console.error('btnBackspace failed:', e);
      this.currentInput.set('0');
    }
  }

  /* ================= EXPRESSION HELPERS ================= */

  /**
   * Убирает "висящие" операторы/точку в конце (например "66+" -> "66"),
   * а также невалидный оператор в начале ("+5" -> "5", "×5" -> "5", "÷5" -> "5").
   * Ведущий "-" сохраняем, т.к. это унарный минус ("-5" остаётся "-5").
   */
  private sanitizeExpression(expr: string): string {
    let result = expr.replace(/[+\-×÷.]+$/, '');
    result = result.replace(/^[+×÷]+/, '');
    return result;
  }

  /**
   * Санитизирует и вычисляет выражение.
   * Возвращает число при успехе или null при невалидном/несчитаемом выражении.
   */
  private evaluateExpression(expr: string): number | null {
    if (!expr || expr === 'Error') return null;

    const sanitized = this.sanitizeExpression(expr);

    if (!sanitized || !this.EXPRESSION_REGEX.test(sanitized)) {
      return null;
    }

    const jsExpression = sanitized.replace(/×/g, '*').replace(/÷/g, '/');

    try {
      const result = Function(`"use strict"; return (${jsExpression})`)();

      if (typeof result !== 'number' || !Number.isFinite(result)) {
        return null;
      }

      return result;
    } catch (e) {
      console.error('evaluateExpression failed for:', jsExpression, e);
      return null;
    }
  }

  calculate() {
    const raw = this.currentInput();

    if (!raw || raw === 'Error') {
      this.currentInput.set('0');
      return;
    }

    const sanitized = this.sanitizeExpression(raw);
    const result = this.evaluateExpression(raw);

    if (result === null) {
      console.error('calculate failed for expression:', raw);
      this.alert.show('error', 'Błąd w obliczeniach. Sprawdź wyrażenie.');
      this.currentInput.set('Error');
      return;
    }

    this.history.set(sanitized);
    this.currentInput.set(String(result));
  }

  /* ================= SAVE ================= */

  enter() {
    const raw = this.currentInput();

    if (raw === 'Error') {
      this.alert.show('error', 'Proszę nacisnąć przycisk =');
      return;
    }


    const value = this.evaluateExpression(raw);

    if (value === null || raw.includes("+") || raw.includes("-") || raw.includes("×") || raw.includes("÷")) {
      this.alert.show('error', 'Proszę nacisnąć przycisk =');
      return;
    }

    if (!this.key) {
      this.alert.show('error', 'Brak klucza — nie można zapisać wartości.');
      return;
    }

    try {
      if (this.isEdit && this.editId) {
        const list = this.listService.savedLists()[this.editId];
        if (!list) {
          this.alert.show('error', 'Nie znaleziono listy do edycji.');
          return;
        }

        this.listService.updateSavedList(this.editId, {
          ...list,
          value: {
            ...list.value,
            [this.key]: value,
          },
        });

        this.router.navigate(['app/load-management/edit', this.editId]).catch((e) => {
          console.error('Navigation failed after edit save:', e);
          this.alert.show('error', 'Nie udało się przejść do listy edycji.');
        });
      } else {
        this.listService.addToList(this.key, value);

        this.router.navigate(['app/load-management/add']).catch((e) => {
          console.error('Navigation failed after add:', e);
          this.alert.show('error', 'Nie udało się przejść do listy.');
        });
      }
    } catch (e) {
      console.error('enter() failed:', e);
      this.alert.show('error', 'Wystąpił błąd podczas zapisywania wartości.');
    }
  }

  back() {
    try {
      this.location.back();
    } catch (e) {
      console.error('back() failed:', e);
      this.router.navigate(['app/load-management']).catch((navErr) => {
        console.error('Fallback navigation failed:', navErr);
      });
    }
  }
}