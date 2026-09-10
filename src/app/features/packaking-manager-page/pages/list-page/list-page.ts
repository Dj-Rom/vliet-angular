import { Component, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { KeyValue, KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Item } from '../../../../shared/item/item';
import {
  ListItem,
  ListService,
} from '../../../../core/services/load-calculator-services/load-calculator.service';
import { PackakingListModal } from '../../components/packaking-list-modal/packaking-list-modal';

export type ListFilter = 'all' | 'today';

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [Item, KeyValuePipe, NgForOf, NgIf, PackakingListModal],
  templateUrl: './list-page.html',
  styleUrls: ['../shared-list-styles.css'],
})
export class ListPage implements OnInit, OnDestroy {
  filter = signal<ListFilter>('all');
  private sub?: Subscription;

  readonly sortByNewest = (
    a: KeyValue<string, ListItem>,
    b: KeyValue<string, ListItem>,
  ): number => {
    const diff = this.getItemTimestamp(b.value) - this.getItemTimestamp(a.value);
    if (diff !== 0) return diff;
    return (b.key || '').localeCompare(a.key || '');
  };

  list = computed<Record<string, ListItem>>(() => {
    const allLists = this.listService.savedLists();

    const filtered =
      this.filter() === 'today'
        ? Object.entries(allLists).filter(([_, item]) => this.isToday(item))
        : Object.entries(allLists);

    filtered.sort(([, a], [, b]) => this.getItemTimestamp(b) - this.getItemTimestamp(a));

    const sortedMap: Record<string, ListItem> = {};
    for (const [key, item] of filtered) {
      sortedMap[key] = item;
    }
    return sortedMap;
  });

  constructor(
    protected listService: ListService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.updateFilter();
    this.sub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateFilter();
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private updateFilter() {
    const isToday = this.router.url.includes('/today');
    this.filter.set(isToday ? 'today' : 'all');
  }

  private isToday(item: ListItem): boolean {
    if (!item) return false;
    const todayStr = this.todayDate();
    if (item.date && item.date.startsWith(todayStr)) {
      return true;
    }
    const timestamp = this.getItemTimestamp(item);
    if (timestamp > 0) {
      const itemDate = new Date(timestamp);
      const now = new Date();
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }
    return false;
  }

  private getItemTimestamp(item?: ListItem): number {
    if (!item) return 0;

    // 1. MUST parse item.date FIRST — this is the real package date
    if (item.date) {
      const dateStr = item.date.trim();

      if (/^\d{10,13}$/.test(dateStr)) {
        const num = Number(dateStr);
        return num < 1e11 ? num * 1000 : num;
      }

      const dotMatch = dateStr.match(
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:(?:\s*-\s*|\s+)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
      );
      if (dotMatch) {
        const day = parseInt(dotMatch[1], 10);
        const month = parseInt(dotMatch[2], 10) - 1;
        const year = parseInt(dotMatch[3], 10);
        const hour = dotMatch[4] ? parseInt(dotMatch[4], 10) : 0;
        const minute = dotMatch[5] ? parseInt(dotMatch[5], 10) : 0;
        const second = dotMatch[6] ? parseInt(dotMatch[6], 10) : 0;
        const parsed = new Date(year, month, day, hour, minute, second).getTime();
        if (!isNaN(parsed)) return parsed;
      }

      const slashMatch = dateStr.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:(?:\s*-\s*|\s+)(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
      );
      if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10) - 1;
        const year = parseInt(slashMatch[3], 10);
        const hour = slashMatch[4] ? parseInt(slashMatch[4], 10) : 0;
        const minute = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
        const second = slashMatch[6] ? parseInt(slashMatch[6], 10) : 0;
        const parsed = new Date(year, month, day, hour, minute, second).getTime();
        if (!isNaN(parsed)) return parsed;
      }

      const standard = Date.parse(dateStr);
      if (!isNaN(standard) && standard > 0) {
        return standard;
      }
    }

    // 2. Only fallback to createdAt if item.date is missing
    if (item.createdAt) {
      const created = new Date(item.createdAt).getTime();
      if (!isNaN(created) && created > 0) {
        return created;
      }
    }

    return 0;
  }

  private todayDate(): string {
    return this.listService.formatDate(new Date()).split(' ')[0];
  }

  protected readonly Object = Object;
}
