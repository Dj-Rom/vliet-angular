import { Component, ElementRef, ViewChild, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { NgForOf } from '@angular/common';
import { AddNewWaybillsService } from '../../services/add-new-waybills.service';
import { EditWaybillService } from '../../services/edit-waybill.service';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  templateUrl: './time-picker.html',
  styleUrls: ['./time-picker.css'],
  imports: [NgForOf],
})
export class TimePickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hoursWheel') hoursWheel?: ElementRef<HTMLDivElement>;
  @ViewChild('minutesWheel') minutesWheel?: ElementRef<HTMLDivElement>;

  readonly paddingItems = 2;
  readonly itemHeight = 44;
  readonly containerHeight = 220;
  readonly centerOffset = this.containerHeight / 2 - this.itemHeight / 2;

  private hourTimer?: ReturnType<typeof setTimeout>;
  private minuteTimer?: ReturnType<typeof setTimeout>;

  private date = new Date();

  readonly hours = [
    ...Array(this.paddingItems).fill(''),
    ...Array.from({ length: 24 }, (_, i) => this.pad(i)),
    ...Array(this.paddingItems).fill(''),
  ];

  readonly minutes = [
    ...Array(this.paddingItems).fill(''),
    ...Array.from({ length: 60 }, (_, i) => this.pad(i)),
    ...Array(this.paddingItems).fill(''),
  ];

  selectedHour = signal<string>(this.pad(this.date.getHours()));
  selectedMinute = signal<string>(this.pad(this.date.getMinutes()));

  constructor(
    private addNewWaybillsService: AddNewWaybillsService,
    private editWaybillService: EditWaybillService,
  ) {
    let existingTime = '';
    if (this.addNewWaybillsService.isOpenTimeStartModal()) {
      existingTime = this.addNewWaybillsService.currentDate().timeStart;
    } else if (this.addNewWaybillsService.isOpenTimeEndModal()) {
      existingTime = this.addNewWaybillsService.currentDate().timeFinish;
    } else if (this.editWaybillService.isOpenEditTimeStartModal()) {
      existingTime = this.editWaybillService.currentDate().timeStart;
    } else if (this.editWaybillService.isOpenEditTimeEndModal()) {
      existingTime = this.editWaybillService.currentDate().timeFinish;
    }

    if (existingTime && existingTime.includes(':')) {
      const parts = existingTime.split(':');
      if (parts[0] !== undefined && parts[1] !== undefined) {
        this.selectedHour.set(parts[0].padStart(2, '0'));
        this.selectedMinute.set(parts[1].padStart(2, '0'));
      }
    }
  }

  ngAfterViewInit(): void {
    try {
      this.scrollToInitial();
    } catch (e) {
      console.error('TimePickerComponent: scrollToInitial failed:', e);
    }
  }

  ngOnDestroy(): void {
    if (this.hourTimer) clearTimeout(this.hourTimer);
    if (this.minuteTimer) clearTimeout(this.minuteTimer);
  }

  // -------------------------
  // Scroll handlers
  // -------------------------

  onHourScroll(): void {
    try {
      if (!this.hoursWheel) {
        console.warn('TimePickerComponent: hoursWheel is not available');
        return;
      }
      this.handleScroll(this.hoursWheel, this.hours, this.selectedHour, 'hour');
    } catch (e) {
      console.error('TimePickerComponent: onHourScroll failed:', e);
    }
  }

  onMinuteScroll(): void {
    try {
      if (!this.minutesWheel) {
        console.warn('TimePickerComponent: minutesWheel is not available');
        return;
      }
      this.handleScroll(this.minutesWheel, this.minutes, this.selectedMinute, 'minute');
    } catch (e) {
      console.error('TimePickerComponent: onMinuteScroll failed:', e);
    }
  }

  // -------------------------
  // Core logic
  // -------------------------

  private handleScroll(
    wheel: ElementRef<HTMLDivElement>,
    list: string[],
    valueSignal: { set: (v: string) => void },
    type: 'hour' | 'minute',
  ): void {
    const el = wheel?.nativeElement;
    if (!el) {
      console.warn(`TimePickerComponent: handleScroll called with missing element (${type})`);
      return;
    }

    if (!Array.isArray(list) || list.length <= this.paddingItems * 2) {
      console.error(`TimePickerComponent: invalid list for ${type}`, list);
      return;
    }

    const rawIndex =
      Math.round((el.scrollTop + this.centerOffset) / this.itemHeight) - this.paddingItems;

    const maxIndex = list.length - this.paddingItems * 2 - 1;
    const index = Math.max(0, Math.min(Number.isFinite(rawIndex) ? rawIndex : 0, maxIndex));

    const value = list[index + this.paddingItems];

    // padding-элементы — пустые строки, их нельзя выбирать как реальное значение
    if (value) {
      valueSignal.set(value);
    } else {
      console.warn(`TimePickerComponent: resolved empty value for ${type} at index ${index}, skipping`);
    }

    const timerRef = type === 'hour' ? this.hourTimer : this.minuteTimer;
    if (timerRef) clearTimeout(timerRef);

    const timer = setTimeout(() => {
      try {
        this.snapToCenter(wheel, index);
      } catch (e) {
        console.error(`TimePickerComponent: snapToCenter failed for ${type}:`, e);
      }
    }, 100);

    if (type === 'hour') {
      this.hourTimer = timer;
    } else {
      this.minuteTimer = timer;
    }
  }

  private snapToCenter(wheel: ElementRef<HTMLDivElement>, index: number): void {
    const el = wheel?.nativeElement;
    if (!el) return;

    el.scrollTo({
      top: (index + this.paddingItems) * this.itemHeight - this.centerOffset,
      behavior: 'smooth',
    });
  }

  private scrollToInitial(): void {
    this.scrollToValue(this.hoursWheel, this.hours.indexOf(this.selectedHour()));
    this.scrollToValue(this.minutesWheel, this.minutes.indexOf(this.selectedMinute()));
  }

  private scrollToValue(wheel: ElementRef<HTMLDivElement> | undefined, index: number): void {
    const el = wheel?.nativeElement;
    if (!el) {
      console.warn('TimePickerComponent: scrollToValue called with missing element');
      return;
    }

    // indexOf вернёт -1, если значение не найдено в списке — тогда скроллим в начало (0)
    const safeIndex = index >= 0 ? index : 0;

    el.scrollTop = (safeIndex + this.paddingItems) * this.itemHeight - this.centerOffset;
  }

  // -------------------------
  // Data sync
  // -------------------------

  private updateTime(): void {
    try {
      const hour = this.selectedHour();
      const minute = this.selectedMinute();

      if (!hour || !minute) {
        console.warn('TimePickerComponent: updateTime called with incomplete time', { hour, minute });
        return;
      }

      const time = `${hour}:${minute}`;

      // Add new waybill
      try {
        this.addNewWaybillsService.setCurrentDate(
          this.addNewWaybillsService.isOpenTimeStartModal() ? 'timeStart' : 'timeFinish',
          time,
        );
      } catch (e) {
        console.error('TimePickerComponent: failed to sync time with AddNewWaybillsService:', e);
      }

      // Edit waybill
      try {
        if (this.editWaybillService.isOpenEditTimeStartModal()) {
          this.editWaybillService.currentDate.set({
            ...this.editWaybillService.currentDate(),
            timeStart: time,
          });
        }

        if (this.editWaybillService.isOpenEditTimeEndModal()) {
          this.editWaybillService.currentDate.set({
            ...this.editWaybillService.currentDate(),
            timeFinish: time,
          });
        }
      } catch (e) {
        console.error('TimePickerComponent: failed to sync time with EditWaybillService:', e);
      }
    } catch (e) {
      console.error('TimePickerComponent: updateTime failed:', e);
    }
  }

  close(): void {
    this.addNewWaybillsService.isOpenTimeStartModal.set(false);
    this.addNewWaybillsService.isOpenTimeEndModal.set(false);
    this.editWaybillService.isOpenEditTimeStartModal.set(false);
    this.editWaybillService.isOpenEditTimeEndModal.set(false);
  }

  save(): void {
    try {
      this.updateTime();
    } catch (e) {
      console.error('TimePickerComponent: save -> updateTime failed:', e);
    } finally {
      try {
        this.addNewWaybillsService.isOpenTimeStartModal.set(false);
        this.addNewWaybillsService.isOpenTimeEndModal.set(false);
        this.editWaybillService.isOpenEditTimeStartModal.set(false);
        this.editWaybillService.isOpenEditTimeEndModal.set(false);
      } catch (e) {
        console.error('TimePickerComponent: failed to close modals in save():', e);
      }
    }
  }

  private pad(n: number): string {
    if (!Number.isFinite(n) || n < 0) {
      console.warn('TimePickerComponent: pad received invalid number:', n);
      return '00';
    }
    return Math.floor(n).toString().padStart(2, '0');
  }
}