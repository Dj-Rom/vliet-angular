import { Item } from '../../item/item';
import { Component } from '@angular/core';

@Component({
  selector: 'app-available-capacity-modal',
  standalone: true,
  imports: [Item],
  templateUrl: './available-capacity-modal.html',
  styleUrl: './available-capacity-modal.css',
})
export class AvailableCapacityModal {
  readonly InitialListAvailableCapacity = {
    KK: 0,
    CC: 0,
    EURO: 0,
    ISO: 0,
    FIN: 0,
  };

  listAvCapacity: Record<string, number>;

  constructor() {
    const saved = localStorage.getItem('InitialListAvailableCapacity');

    this.listAvCapacity = saved ? JSON.parse(saved) : { ...this.InitialListAvailableCapacity };
  }

  close() {
    localStorage.setItem('InitialListAvailableCapacity', JSON.stringify(this.listAvCapacity));

    this.listAvCapacity = { ...this.InitialListAvailableCapacity };
  }

  protected readonly Object = Object;
  protected readonly Number = Number;
}
