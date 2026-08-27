import { Component, Input } from '@angular/core';
import { ListItem } from '../../core/services/load-calculator-services/load-calculator.service';
import { LoadCalculatorPage } from '../../features/packaking-manager-page/layout/load-calculator-page';

@Component({
  selector: 'app-item',
  standalone: true,
  templateUrl: './item.html',
  styleUrls: ['./item.css'],
})
export class Item {
  @Input() title!: string;
  @Input() date!: string;
  @Input() item!: ListItem;
  constructor(protected loadCalc: LoadCalculatorPage) {}
}
