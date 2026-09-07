import { Component, computed, Input, signal } from '@angular/core';
import { NgForOf } from '@angular/common';

import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { AlertService } from '../../../../core/services/alert.service';
import { WaybillsService } from '../../services/waybills.service';
import { ReportService } from '../../services/get-report.service';
import { PdfReportService } from '../../services/pdf.service';
import { EditWaybillService } from '../../services/edit-waybill.service';
import { _Alert } from '../../../../shared/alert/alert';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

interface ReportRow {
  id?: string;
  truck: string;
  trailer: string;
  start: string;
  finish: string;
  notes: string;
}

export const MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgForOf],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {
  @Input() rangeAvailable = false;

  private reportRows: ReportRow[] = [];

  today = new Date();

  selectedDate = signal<Date | null>(null);
  currentMonth = signal(this.today.getMonth());
  currentYear = signal(this.today.getFullYear());
  rangeStart = signal<Date | null>(null);
  rangeEnd = signal<Date | null>(null);

  readonly months = MONTHS;

  constructor(
    private addNewWaybillsService: AddNewWaybillsService,
    private pdf: PdfReportService,
    private alert: AlertService,
    private waybillsService: WaybillsService,
    private editWaybill: EditWaybillService,
    private reportService: ReportService,
  ) {
    let existingDateStr = '';
    if (this.addNewWaybillsService.isOpenCalendarStartModal()) {
      existingDateStr = this.addNewWaybillsService.currentDate().dataStart;
    } else if (this.addNewWaybillsService.isOpenCalendarEndModal()) {
      existingDateStr = this.addNewWaybillsService.currentDate().dataFinish;
    } else if (this.editWaybill.isOpenEditCalendarStartModal()) {
      existingDateStr = this.editWaybill.currentDate().dataStart;
    } else if (this.editWaybill.isOpenEditCalendarEndModal()) {
      existingDateStr = this.editWaybill.currentDate().dataFinish;
    }

    if (existingDateStr) {
      const parsed = this.parseDateString(existingDateStr);
      if (parsed) {
        this.selectedDate.set(parsed);
        this.currentMonth.set(parsed.getMonth());
        this.currentYear.set(parsed.getFullYear());
      }
    }
  }

  private parseDateString(str: string): Date | null {
    if (!str) return null;
    const parts = str.trim().split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthPrefix = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      const monthIndex = MONTHS.findIndex((m) => m.toLowerCase().startsWith(monthPrefix));
      if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    return null;
  }

  /* ---------- CALENDAR ---------- */

  days = computed<CalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday start
    const result: CalendarDay[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      result.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        inMonth: false,
      });
    }

    const currentMonthLastDay = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= currentMonthLastDay; d++) {
      result.push({
        date: new Date(year, month, d),
        inMonth: true,
      });
    }

    while (result.length % 7 !== 0) {
      const d = result.length - currentMonthLastDay - startDay + 1;
      result.push({
        date: new Date(year, month + 1, d),
        inMonth: false,
      });
    }

    return result;
  });

  /* ---------- NAVIGATION ---------- */

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
  }

  setMonth(month: number): void {
    this.currentMonth.set(month);
  }

  setYear(year: number): void {
    this.currentYear.set(year);
  }

  /* ---------- HELPERS ---------- */

  private toMidnight(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  isToday(d: Date): boolean {
    return this.toMidnight(d) === this.toMidnight(this.today);
  }

  isSelected(d: Date): boolean {
    const selected = this.selectedDate();
    return !!selected && this.toMidnight(selected) === this.toMidnight(d);
  }

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')} ${MONTHS[date.getMonth()].slice(
      0,
      3,
    )} ${date.getFullYear()}`;
  }

  /* ---------- RANGE ---------- */

  isRangeStart(d: Date): boolean {
    const start = this.rangeStart();
    return !!start && this.toMidnight(start) === this.toMidnight(d);
  }

  isRangeEnd(d: Date): boolean {
    const end = this.rangeEnd();
    return !!end && this.toMidnight(end) === this.toMidnight(d);
  }

  isRangeSingle(d: Date): boolean {
    const start = this.rangeStart();
    if (!start) return false;
    const startMs = this.toMidnight(start);
    const dMs = this.toMidnight(d);
    if (startMs !== dMs) return false;
    const end = this.rangeEnd();
    return !end || startMs === this.toMidnight(end);
  }

  isInRange(d: Date): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || !end) return false;
    const dMs = this.toMidnight(d);
    return dMs > this.toMidnight(start) && dMs < this.toMidnight(end);
  }

  /* ---------- SELECTION ---------- */

  selectDay(day: CalendarDay): void {
    const date = day.date;

    if (this.rangeAvailable) {
      if (!this.rangeStart()) {
        this.rangeStart.set(date);
        this.rangeEnd.set(null);
        return;
      }

      if (!this.rangeEnd()) {
        if (this.toMidnight(date) < this.toMidnight(this.rangeStart()!)) {
          this.rangeStart.set(date);
        } else {
          this.rangeEnd.set(date);
        }
        return;
      }

      this.rangeStart.set(date);
      this.rangeEnd.set(null);
      return;
    }

    this.selectedDate.set(date);
  }

  generateReport(start: Date, finish: Date): void {
    const all = this.waybillsService.waybills();
    const filtered = this.reportService.filterByRange(all, start, finish);
    this.reportRows = this.reportService.buildTableData(filtered);
    this.waybillsService.isReportOpen.set(false);
  }

  close(): void {
    this.addNewWaybillsService.isOpenCalendarStartModal.set(false);
    this.addNewWaybillsService.isOpenCalendarEndModal.set(false);
    this.editWaybill.isOpenEditCalendarStartModal.set(false);
    this.editWaybill.isOpenEditCalendarEndModal.set(false);
    this.waybillsService.isReportOpen.set(false);
  }

  save(): void {
    if (this.rangeAvailable) {
      const start = this.rangeStart();
      const end = this.rangeEnd();

      if (!start || !end) {
        this.alert.show('error', 'Select date range');
        return;
      }

      this.generateReport(start, end);
      this.pdf.createReport(this.reportRows, start, end);
    } else {
      const date = this.selectedDate();
      if (date) {
        if (this.addNewWaybillsService.isOpenCalendarStartModal()) {
          this.addNewWaybillsService.setCurrentDate('dataStart', this.formatDate(date));
        }

        if (this.addNewWaybillsService.isOpenCalendarEndModal()) {
          this.addNewWaybillsService.setCurrentDate('dataFinish', this.formatDate(date));
        }

        if (this.editWaybill.isOpenEditCalendarStartModal()) {
          this.editWaybill.currentDate.set({
            ...this.editWaybill.currentDate(),
            dataStart: this.formatDate(date),
          });
        }

        if (this.editWaybill.isOpenEditCalendarEndModal()) {
          this.editWaybill.currentDate.set({
            ...this.editWaybill.currentDate(),
            dataFinish: this.formatDate(date),
          });
        }
      }
    }

    this.addNewWaybillsService.isOpenCalendarStartModal.set(false);
    this.addNewWaybillsService.isOpenCalendarEndModal.set(false);
    this.editWaybill.isOpenEditCalendarStartModal.set(false);
    this.editWaybill.isOpenEditCalendarEndModal.set(false);
  }
}
