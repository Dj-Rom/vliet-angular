import { Component } from '@angular/core';
import { MobileNavigationService } from '../../../core/services/mobile-navigation.service';

@Component({
  selector: 'app-mobile',
  standalone: true,
  templateUrl: './mobile.html',
  styleUrls: ['./mobile.css'],
})
export class Mobile {
  constructor(public mobile: MobileNavigationService) {}
}
