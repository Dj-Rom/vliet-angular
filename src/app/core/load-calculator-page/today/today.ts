import { Component } from '@angular/core';
import { KeyValuePipe, NgForOf } from '@angular/common';
import { Item } from '../../load-calculator/item/item';
import { ListItem, ListService } from '../../../services/load-calculator-services/load-calculator-service';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [
    Item,
    KeyValuePipe
  ],
  templateUrl: './today.html',
  styleUrls: ['./today.css'],
})
export class Today {

  list: { [key: string]: ListItem } = {};

  constructor(private listService: ListService, ) {
    this.list = this.listService.getSavedLists();
   let date = this.listService.formatDate(new Date()).split(' ')[0]
   let listKeys =  Object.keys(this.list).filter(key => key.split(' ')[0] === date);
   this.list = listKeys.reduce((acc, key) => ({...acc, [key]: this.list[key]}), {});
  }
}
