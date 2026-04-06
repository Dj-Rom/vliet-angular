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

  isToday(d: Date): boolean {
    return d.toDateString() === this.today.toDateString();
  }

  isSelected(d: Date): boolean {
    return this.selectedDate()?.toDateString() === d.toDateString();
  }

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')} ${MONTHS[date.getMonth()].slice(
      0,
      3,
    )} ${date.getFullYear()}`;
  }

  /* ---------- RANGE ---------- */

  isRangeStart(d: Date): boolean {
    return this.rangeStart()?.toDateString() === d.toDateString();
  }

  isRangeEnd(d: Date): boolean {
    return this.rangeEnd()?.toDateString() === d.toDateString();
  }

  isInRange(d: Date): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    return !!start && !!end && d > start && d < end;
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
        if (date < this.rangeStart()!) {
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

  generateReport(start: Date, finish: Date): void {
    const all = this.waybillsService.waybills();
    const filtered = this.reportService.filterByRange(all, start, finish);
    this.reportRows = this.reportService.buildTableData(filtered);
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
    }

    this.addNewWaybillsService.isOpenCalendarStartModal.set(false);
    this.addNewWaybillsService.isOpenCalendarEndModal.set(false);
    this.editWaybill.isOpenEditCalendarStartModal.set(false);
    this.editWaybill.isOpenEditCalendarEndModal.set(false);
  }
}
