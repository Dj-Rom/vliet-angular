import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FirebaseClientService } from '../../firebase/firebase.service';
import { ListService } from '../../services/load-calculator-services/load-calculator-service';
import { _Alert } from '../alert/alert';
import { MoreMenu } from '../navigation/more-menu/more-menu';
import { MoreMenuService } from '../../services/load-calculator-services/more-menu';

@Component({
  selector: 'app-load-calculator-page',
  imports: [
    RouterOutlet,
    FormsModule,
    NgIf,
    _Alert,
    MoreMenu
  ],
  templateUrl: './load-calculator-page.html',
  styleUrls: ['./load-calculator-page.css'],
})
export class LoadCalculatorPage implements OnInit {
  selectedPage: string = 'all';
  isOpenMoreMenu: boolean = false;
  menuTitle: string = '';
  menuDate: string = '';

  constructor(
    private router: Router,
    private loadCalculatorService: ListService,
    private firebase: FirebaseClientService,
    private moreMenuService: MoreMenuService
  ) {
    this.selectedPage = router.url.split('/').pop() || 'all';
  }

  ngOnInit() {
    this.updateMenuState();
    this.moreMenuService.isOpenMenuChanged$.subscribe(() => {
      this.updateMenuState();
    });



        const lastSegment = this.router.url.split('/').pop();
    this.selectedPage = lastSegment || 'all';
        console.log(lastSegment)
        console.log(this.selectedPage=== 'load-management')
        if (this.selectedPage === 'load-management') {
          console.log(this.selectedPage)
          this.changePage('all');
        }
  }

  updateMenuState() {
    this.isOpenMoreMenu = this.moreMenuService.getIsActiveMoreMenu();
  }

  openMenu(title: string, date: string) {
    this.menuTitle = title;
    this.menuDate = date;
    this.moreMenuService.setIsOpenMoreMenu();
  }

  doneSave() {
    this.loadCalculatorService.onDone();
  }

  changePage(page: string) {
    this.selectedPage = page;
    this.router.navigate(['app/load-management', page]);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('img')) {
      this.moreMenuService.closeMoreMenu();
    }
  }
}
