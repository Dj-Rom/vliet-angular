import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwipeNavigationService } from '../core/services/swipe-navi.service';

@Component({
  selector: 'app-swipe',
  template: ``,
})
export class SwipeComponent implements OnInit, OnDestroy {
  constructor(private swipeNav: SwipeNavigationService) {}

  ngOnInit() {
    this.swipeNav.init();
  }

  ngOnDestroy() {
    this.swipeNav.destroy();
  }
}
