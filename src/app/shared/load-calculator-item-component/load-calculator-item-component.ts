import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-load-calculator-item',

  templateUrl: './load-calculator-item-component.html',
  styleUrl: './load-calculator-item-component.css',
})
export class LoadCalculatorItemComponent {
  @Input() type!: string;
  @Input() value!: number;

  @Output() increment = new EventEmitter<string>();
  @Output() decrement = new EventEmitter<string>();
  @Output() calculate = new EventEmitter<string>();
}
