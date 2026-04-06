import { computed, EventEmitter, Injectable, Output, signal } from '@angular/core';
import { DateRange } from '../../../../interfaces';

export interface Holiday {
  id: string;
  name: string;
  isMovable?: boolean; // true for holidays like Easter that change dates each year
}

export interface MonthDay {
  date: Date;
  day: number;
  weekday: string;
  weekdayIndex: number;
  isWeekend: boolean;
  holiday?: Holiday | null;
}

@Injectable({
  providedIn: 'root',
})
export class DateFilterService {
  today = new Date();

  currentSelectedMonth = signal(this.today.getMonth());
  currentSelectedYear = signal(this.today.getFullYear());
  selectedDay = signal<MonthDay | null>(null);
  selectedRange = signal<DateRange | null>(null);

  private weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

  public MONTHS = [
    { id: 0, name: 'Styczeń', short: 'Sty' },
    { id: 1, name: 'Luty', short: 'Lut' },
    { id: 2, name: 'Marzec', short: 'Mar' },
    { id: 3, name: 'Kwiecień', short: 'Kwi' },
    { id: 4, name: 'Maj', short: 'Maj' },
    { id: 5, name: 'Czerwiec', short: 'Cze' },
    { id: 6, name: 'Lipiec', short: 'Lip' },
    { id: 7, name: 'Sierpień', short: 'Sie' },
    { id: 8, name: 'Wrzesień', short: 'Wrz' },
    { id: 9, name: 'Październik', short: 'Paź' },
    { id: 10, name: 'Listopad', short: 'Lis' },
    { id: 11, name: 'Grudzień', short: 'Gru' },
  ] as const;

  // Fixed holidays (same date every year)
  private readonly FIXED_HOLIDAYS: { month: number; day: number; name: string; id: string }[] = [
    { month: 0, day: 1, name: 'Nowy Rok', id: 'new-year' },
    { month: 0, day: 6, name: 'Święto Trzech Króli', id: 'epiphany' },
    { month: 4, day: 1, name: 'Święto Pracy', id: 'labor-day' },
    { month: 4, day: 3, name: 'Święto Konstytucji 3 Maja', id: 'constitution-day' },
    { month: 7, day: 15, name: 'Wniebowzięcie NMP', id: 'assumption' },
    { month: 10, day: 1, name: 'Wszystkich Świętych', id: 'all-saints' },
    { month: 10, day: 11, name: 'Narodowe Święto Niepodległości', id: 'independence-day' },
    { month: 11, day: 25, name: 'Boże Narodzenie', id: 'christmas-1' },
    { month: 11, day: 26, name: 'Drugi dzień Bożego Narodzenia', id: 'christmas-2' },
  ];

  getMonthDays(year: number, month: number): MonthDay[] {
    const result: MonthDay[] = [];
    const date = new Date(year, month, 1);

    // Calculate movable holidays for this year
    const easterDate = this.calculateEaster(year);
    const corpusChristiDate = this.calculateCorpusChristi(year);

    while (date.getMonth() === month) {
      const jsDay = date.getDay(); // 0=Sun
      const weekdayIndex = jsDay === 0 ? 7 : jsDay;

      const monthDay: MonthDay = {
        date: new Date(date),
        day: date.getDate(),
        weekday: this.weekdays[weekdayIndex - 1],
        weekdayIndex,
        isWeekend: weekdayIndex >= 6,
        holiday: this.getHolidayForDate(date, easterDate, corpusChristiDate),
      };

      result.push(monthDay);
      date.setDate(date.getDate() + 1);
    }

    return result;
  }

  private getHolidayForDate(
    date: Date,
    easterDate: Date,
    corpusChristiDate: Date
  ): Holiday | null {
    const month = date.getMonth();
    const day = date.getDate();

    // Check fixed holidays
    const fixedHoliday = this.FIXED_HOLIDAYS.find(
      (h) => h.month === month && h.day === day
    );
    if (fixedHoliday) {
      return {
        id: fixedHoliday.id,
        name: fixedHoliday.name,
        isMovable: false,
      };
    }

    // Check Easter
    if (this.isSameDate(date, easterDate)) {
      return { id: 'easter', name: 'Wielkanoc', isMovable: true };
    }

    // Check Easter Monday
    const easterMonday = new Date(easterDate);
    easterMonday.setDate(easterDate.getDate() + 1);
    if (this.isSameDate(date, easterMonday)) {
      return { id: 'easter-monday', name: 'Poniedziałek Wielkanocny', isMovable: true };
    }

    // Check Corpus Christi (Boże Ciało)
    if (this.isSameDate(date, corpusChristiDate)) {
      return { id: 'corpus-christi', name: 'Boże Ciało', isMovable: true };
    }

    return null;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  // Calculate Easter using Computus algorithm
  private calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
  }

  // Corpus Christi is 60 days after Easter
  private calculateCorpusChristi(year: number): Date {
    const easter = this.calculateEaster(year);
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    return corpusChristi;
  }

  setRange(start: Date, end: Date) {
    this.selectedRange.set({ start, end });
  }

  isDateInRange(date: Date): boolean {
    const range = this.selectedRange();
    if (!range) return false;

    const d = new Date(date).setHours(0, 0, 0, 0);
    const start = new Date(range.start).setHours(0, 0, 0, 0);
    const end = new Date(range.end).setHours(0, 0, 0, 0);

    return d >= start && d <= end;
  }
}
