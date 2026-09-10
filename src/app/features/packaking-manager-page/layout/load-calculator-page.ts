import { Component, HostListener, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ListService } from '../../../core/services/load-calculator-services/load-calculator.service';
import { MoreMenuModal } from '../../../shared/global-modals/more-menu-modal/more-menu-modal';
import { MoreMenuService } from '../../../core/services/more-menu.service';
import { Location } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';
import { _Alert } from '../../../shared/alert/alert';
import { PackakingModalService } from '../components/packaking-modal.service';
import { PackakingListModal } from '../components/packaking-list-modal/packaking-list-modal';

@Component({
  selector: 'app-load-calculator-page',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgIf,],
  templateUrl: './load-calculator-page.html',
  styleUrls: ['./load-calculator-page.css'],
})
export class LoadCalculatorPage implements OnDestroy {
  selectedPage = 'all';
  menuTitle = '';
  menuDate = '';
  private navSub?: Subscription;

  constructor(
    protected router: Router,
    protected loadCalculatorService: ListService,
    protected moreMenuService: MoreMenuService,
    private modalService: ModalService,
    protected location: Location,
    protected packakingModalService: PackakingModalService,
  ) {
    this.updateSelectedPage();
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSelectedPage();
      });
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  private updateSelectedPage() {
    const url = this.router.url;
    if (url.includes('/today')) {
      this.selectedPage = 'today';
    } else if (url.includes('/all')) {
      this.selectedPage = 'all';
    } else {
      this.selectedPage = url.split('/').pop() || 'all';
    }
  }

  get isOpen() {
    return this.modalService.isNameModalOpen();
  }
  public openPackakingListModal(title: string, date: string, item?: any) {
    this.packakingModalService.getItemAndShowModal(title, date, item);
  }

  openMenu(title: string, date: string) {

    this.menuTitle = title;
    this.menuDate = date;

    this.moreMenuService.openMenu(title, date);
  }

  protected back() {
    this.location.back();
  }
  changePage(page: string) {
    this.selectedPage = page;
    this.router.navigate(['/app/load-management', page]);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('img')) {
      this.moreMenuService.closeMenu();
    }
  }
}
