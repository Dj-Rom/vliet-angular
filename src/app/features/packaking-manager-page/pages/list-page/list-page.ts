import { Component, computed, OnInit } from '@angular/core';
import { KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Item } from '../../../../shared/item/item';
import {
  ListItem,
  ListService,
} from '../../../../core/services/load-calculator-services/load-calculator.service';
import {PackakingListModal} from '../../components/packaking-list-modal/packaking-list-modal';

export type ListFilter = 'all' | 'today';

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [Item, KeyValuePipe, NgForOf, NgIf, PackakingListModal],
  templateUrl: './list-page.html',
  styleUrls: ['../shared-list-styles.css'],
})
export class ListPage implements OnInit {
  filter: ListFilter = 'all';

  list = computed<Record<string, ListItem>>(() => {
    const allLists = this.listService.savedLists();

    if (this.filter === 'today') {
      const today = this.todayDate();
      return Object.keys(allLists)
        .filter((key) => key.startsWith(today))
        .reduce((acc, key) => ({ ...acc, [key]: allLists[key] }), {} as Record<string, ListItem>);
    }

    return allLists;
  });

  constructor(
    protected listService: ListService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Determine filter from route path
    const routePath = this.route.snapshot.url[0]?.path || 'all';
    this.filter = routePath === 'today' ? 'today' : 'all';
  }

  private todayDate(): string {
    return this.listService.formatDate(new Date()).split(' ')[0];
  }

  protected readonly Object = Object;
}
