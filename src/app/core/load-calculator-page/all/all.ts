import {Component, OnInit} from '@angular/core';
import { KeyValuePipe, NgForOf } from '@angular/common';
import { Item } from '../../load-calculator/item/item';
import { ListItem, ListService } from '../../../services/load-calculator-services/load-calculator-service';

@Component({
  selector: 'app-all',
  standalone: true,
  imports: [Item, KeyValuePipe],
  templateUrl: './all.html',
  styleUrls: ['./all.css'],
})
export class All implements OnInit {

  list: { [key: string]: ListItem } = {};

  constructor(private listService: ListService) {}

  ngOnInit() {
    this.loadLists();

    this.listService.listChanged$.subscribe(() => {
      this.loadLists();
    });
  }

  loadLists() {
    this.list = this.listService.getSavedLists() || {};
  }
}
