import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ListService } from '../../../../../core/services/load-calculator-services/load-calculator.service';
import { MoreMenuService } from '../../../../../core/services/more-menu.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-packaging-header',
  standalone: true,
  templateUrl: 'packaging-header-with-filter.html',
  styleUrls: ['../../../pages/add-new-list/add-new-list.css', './packaging-header-with-filter.css'],
  imports: [
    NgIf
  ]
})
export class PackagingHeaderWithFilter {
  filterValue;

  constructor(
    private moreMenuService: MoreMenuService,
    private router: Router,
    protected listService: ListService,
  ) {
    this.filterValue = this.listService.filterValue;
  }

  back() {
    this.router.navigate(['app/load-management/']);
  }

  openMenu() {
    this.moreMenuService.toggleMenu();
  }

  onFilterChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.listService.setFilter(value);
    this.scrollToTop();
  }

  clearFilter() {
    this.listService.setFilter('');
    this.scrollToTop();
  }

  private scrollToTop() {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }

    if (typeof document !== 'undefined') {
      const elementsToScroll: (Element | null)[] = [
        document.scrollingElement,
        document.documentElement,
        document.body,
        document.querySelector('app-root'),
        document.querySelector('.section-add-new-lists'),
        document.querySelector('.calculator-section'),
        document.querySelector('.edit-item-container'),
      ];

      elementsToScroll.forEach((el) => {
        if (el) {
          try {
            el.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            el.scrollTop = 0;
          }
        }
      });
    }
  }

  download() {
    const id = this.listService.onDone();
    if (id) {
      this.moreMenuService.sendToWhatsApp(id);
    }
  }
}
