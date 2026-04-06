import {
  Component,
  computed,
  Output,
  EventEmitter,
  effect,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  afterNextRender,
} from '@angular/core';
import { DateFilterService, MonthDay } from '../../services/date-filter.service';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  templateUrl: './date-filter.html',
  styleUrl: './date-filter.css',
  imports: [NgForOf, NgIf],
})
export class DateFilter implements AfterViewInit {
  @Output() daySelected = new EventEmitter<MonthDay | null>();
  @Output() monthOrYearChanged = new EventEmitter<void>();

  @ViewChildren('dayItem') dayItems!: QueryList<ElementRef<HTMLElement>>;

  private readonly SELECTED_DAY_KEY = 'date_filter_selected_day';
  private readonly SELECTED_MONTH_KEY = 'date_filter_selected_month';
  private readonly SELECTED_YEAR_KEY = 'date_filter_selected_year';

  readonly monthDays = computed(() =>
    this.dateService.getMonthDays(
      this.dateService.currentSelectedYear(),
      this.dateService.currentSelectedMonth(),
    ),
  );

  date = new Date();
  private isFirstLoad = true;

  constructor(
    protected dateService: DateFilterService,
    private cdr: ChangeDetectorRef,
  ) {
    this.initializeSelectedDay();

    afterNextRender(() => {
      this.scrollToSelected();
      this.isFirstLoad = false;
    });

    effect(() => {
      const selectedDay = this.dateService.selectedDay();
      if (selectedDay && !this.isFirstLoad) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.scrollToSelected();
          });
        });
      }
    });

    effect(() => {
      const day = this.dateService.selectedDay();
      if (day) {
        this.saveToCache(day);
      } else {
        localStorage.removeItem(this.SELECTED_DAY_KEY);
      }
    });

    effect(() => {
      const month = this.dateService.currentSelectedMonth();
      localStorage.setItem(this.SELECTED_MONTH_KEY, month.toString());
    });

    effect(() => {
      const year = this.dateService.currentSelectedYear();
      localStorage.setItem(this.SELECTED_YEAR_KEY, year.toString());
    });
  }

  ngAfterViewInit() {
    this.dayItems.changes.subscribe(() => {
      if (!this.isFirstLoad) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.scrollToSelected();
          });
        });
      }
    });
  }

  private initializeSelectedDay(): void {
    const loaded = this.loadFromCache();

    if (!loaded) {
      const currentDay =
        this.monthDays().find(
          (d) =>
            d.date.getDate() === this.date.getDate() &&
            d.date.getMonth() === this.date.getMonth() &&
            d.date.getFullYear() === this.date.getFullYear(),
        ) ?? this.monthDays()[0];

      this.selectDay(currentDay);
    }
  }

  private loadFromCache(): boolean {
    try {
      const cachedMonth = localStorage.getItem(this.SELECTED_MONTH_KEY);
      const cachedYear = localStorage.getItem(this.SELECTED_YEAR_KEY);
      const cachedDay = localStorage.getItem(this.SELECTED_DAY_KEY);

      if (cachedMonth !== null) {
        this.dateService.currentSelectedMonth.set(parseInt(cachedMonth));
      }

      if (cachedYear !== null) {
        this.dateService.currentSelectedYear.set(parseInt(cachedYear));
      }

      if (cachedDay) {
        const dayData = JSON.parse(cachedDay);

        // Try to find the exact date first
        let day = this.monthDays().find(
          (d) => d.date.getTime() === new Date(dayData.date).getTime(),
        );

        // If not found and we have a holiday identifier, try to find the holiday in current month/year
        if (!day && dayData.holidayId) {
          day = this.monthDays().find(
            (d) => (d as any).holiday?.id === dayData.holidayId
          );
        }

        // If still not found but we have day/month info, try to find by day and month
        if (!day && dayData.day !== undefined && dayData.month !== undefined) {
          day = this.monthDays().find(
            (d) =>
              d.date.getDate() === dayData.day &&
              d.date.getMonth() === dayData.month
          );
        }

        if (day) {
          this.dateService.selectedDay.set(day);
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private saveToCache(day: MonthDay): void {
    try {
      const cacheData: any = {
        date: day.date.toISOString(),
        day: day.date.getDate(),
        month: day.date.getMonth(),
        year: day.date.getFullYear(),
      };

      // Save holiday identifier if present for movable holidays
      const dayWithHoliday = day as any;
      if (dayWithHoliday.holiday?.id) {
        cacheData.holidayId = dayWithHoliday.holiday.id;
      }

      localStorage.setItem(
        this.SELECTED_DAY_KEY,
        JSON.stringify(cacheData),
      );
    } catch (error) {
      // Silent fail
    }
  }

  private scrollToSelected(): void {
    if (!this.dayItems?.length) return;

    const selectedDay = this.dateService.selectedDay();
    if (!selectedDay) return;

    const index = this.monthDays().findIndex((d) => d === selectedDay);
    if (index === -1) return;

    const element = this.dayItems.get(index)?.nativeElement;
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }

  viewAllDayItems(): void {
    this.dateService.selectedDay.set(null);
    this.daySelected.emit(null);
  }

  selectDay(day: MonthDay): void {
    const currentSelected = this.dateService.selectedDay();

    if (currentSelected === day) {
      // Отмена выбора - показать весь месяц
      this.dateService.selectedDay.set(null);
      this.daySelected.emit(null);
    } else {
      // Выбор нового дня
      this.dateService.selectedDay.set(day);
      this.daySelected.emit(day);
    }
  }

  isSelected(day: MonthDay): boolean {
    return this.dateService.selectedDay() === day;
  }

  backMonth(): void {
    if (this.dateService.currentSelectedMonth() === 0) {
      this.dateService.currentSelectedMonth.set(11);
      this.dateService.currentSelectedYear.update((y) => y - 1);
    } else {
      this.dateService.currentSelectedMonth.update((m) => m - 1);
    }
    this.dateService.selectedDay.set(null);
    this.monthOrYearChanged.emit();
  }

  nextMonth(): void {
    if (this.dateService.currentSelectedMonth() === 11) {
      this.dateService.currentSelectedMonth.set(0);
      this.dateService.currentSelectedYear.update((y) => y + 1);
    } else {
      this.dateService.currentSelectedMonth.update((m) => m + 1);
    }
    this.dateService.selectedDay.set(null);
    this.monthOrYearChanged.emit();
  }

  backYear(): void {
    this.dateService.currentSelectedYear.update((y) => y - 1);
    this.dateService.selectedDay.set(null);
    this.monthOrYearChanged.emit();
  }

  nextYear(): void {
    this.dateService.currentSelectedYear.update((y) => y + 1);
    this.dateService.selectedDay.set(null);
    this.monthOrYearChanged.emit();
  }

  goToToday(): void {
    const today = new Date();
    this.dateService.currentSelectedMonth.set(today.getMonth());
    this.dateService.currentSelectedYear.set(today.getFullYear());

    requestAnimationFrame(() => {
      const currentDay = this.monthDays().find(
        (d) =>
          d.date.getDate() === today.getDate() &&
          d.date.getMonth() === today.getMonth() &&
          d.date.getFullYear() === today.getFullYear(),
      );

      if (currentDay) {
        this.selectDay(currentDay);
      }
    });
  }
}
