import { Component } from '@angular/core';
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
  }

  clearFilter() {
    this.listService.setFilter('');
  }

  download() {
    const id = this.listService.onDone();
    if (id) {
      this.moreMenuService.sendToWhatsApp(id);
    }
  }
}
