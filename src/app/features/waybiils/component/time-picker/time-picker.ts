import { Component, ElementRef, ViewChild, signal, AfterViewInit } from '@angular/core';
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
export class TimePickerComponent implements AfterViewInit {
  @ViewChild('hoursWheel') hoursWheel!: ElementRef<HTMLDivElement>;
  @ViewChild('minutesWheel') minutesWheel!: ElementRef<HTMLDivElement>;

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
  ) {}

  ngAfterViewInit(): void {
    this.scrollToInitial();
  }

  // -------------------------
  // Scroll handlers
  // -------------------------

  onHourScroll(): void {
    this.handleScroll(this.hoursWheel, this.hours, this.selectedHour, 'hour');
    this.updateTime();
  }

  onMinuteScroll(): void {
    this.handleScroll(this.minutesWheel, this.minutes, this.selectedMinute, 'minute');
    this.updateTime();
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
    const el = wheel.nativeElement;

    const rawIndex =
      Math.round((el.scrollTop + this.centerOffset) / this.itemHeight) - this.paddingItems;

    const maxIndex = list.length - this.paddingItems * 2 - 1;
    const index = Math.max(0, Math.min(rawIndex, maxIndex));

    valueSignal.set(list[index + this.paddingItems]);

    const timerRef = type === 'hour' ? this.hourTimer : this.minuteTimer;
    if (timerRef) clearTimeout(timerRef);

    const timer = setTimeout(() => {
      this.snapToCenter(wheel, index);
    }, 100);

    if (type === 'hour') {
      this.hourTimer = timer;
    } else {
      this.minuteTimer = timer;
    }
  }

  private snapToCenter(wheel: ElementRef<HTMLDivElement>, index: number): void {
    wheel.nativeElement.scrollTo({
      top: (index + this.paddingItems) * this.itemHeight - this.centerOffset,
      behavior: 'smooth',
    });
  }

  private scrollToInitial(): void {
    this.scrollToValue(this.hoursWheel, this.hours.indexOf(this.selectedHour()));
    this.scrollToValue(this.minutesWheel, this.minutes.indexOf(this.selectedMinute()));
  }

  private scrollToValue(wheel: ElementRef<HTMLDivElement>, index: number): void {
    wheel.nativeElement.scrollTop =
      (index + this.paddingItems) * this.itemHeight - this.centerOffset;
  }

  // -------------------------
  // Data sync
  // -------------------------

  private updateTime(): void {
    const time = `${this.selectedHour()}:${this.selectedMinute()}`;

    // Add new waybill
    this.addNewWaybillsService.setCurrentDate(
      this.addNewWaybillsService.isOpenTimeStartModal() ? 'timeStart' : 'timeFinish',
      time,
    );

    // Edit waybill
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
  }

  save(): void {
    this.updateTime();
    this.addNewWaybillsService.isOpenTimeStartModal.set(false);
    this.addNewWaybillsService.isOpenTimeEndModal.set(false);
    this.editWaybillService.isOpenEditTimeStartModal.set(false);
    this.editWaybillService.isOpenEditTimeEndModal.set(false);
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
