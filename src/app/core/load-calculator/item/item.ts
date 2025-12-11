import {Component, Input} from '@angular/core';
import {ListService} from '../../../services/load-calculator-services/load-calculator-service';
import {LoadCalculatorPage} from '../../load-calculator-page/load-calculator-page';


@Component({
  selector: 'app-item',
  imports: [],
  templateUrl: './item.html',
  styleUrl: './item.css',
})
export class Item {
  @Input() title!: string;
  @Input() date!: string;
 constructor(protected loadCalc: LoadCalculatorPage) {
 }


}
