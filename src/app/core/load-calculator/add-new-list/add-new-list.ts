import {Component, OnDestroy, signal} from '@angular/core';
import {NgForOf, KeyValuePipe, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ListItem, ListService} from '../../../services/load-calculator-services/load-calculator-service';
import {RouterLink} from '@angular/router';
import {AddNameModal} from '../../modal-windows/add-name-modal/add-name-modal';


@Component({
  selector: 'app-add-new-list',
  standalone: true,
  imports: [NgForOf, KeyValuePipe, FormsModule, NgIf, RouterLink, AddNameModal],
  templateUrl: './add-new-list.html',
  styleUrls: ['./add-new-list.css']
})
export class AddNewList implements OnDestroy {

  currentList: ListItem = { name: '', date: '', value: {} };
  filteredList: { [key: string]: number } = {};
  filterValue = '';
  companyName: string = "";
  isInputNameCompany = false;
  isOpenedModalForName= signal<boolean>(true);
  private sub = new Subscription();

  constructor(private listService: ListService) {
    this.companyName = this.listService.getCurrentCompanyName();
    this.sub.add(
      this.listService.list$.subscribe(list => {
        this.currentList = { ...list };
        this.applyFilter(this.filterValue);
      })
    );
  }

setIsOpenedModalForName(){
    this.isOpenedModalForName.set(!this.isOpenedModalForName)
  console.log(this.isOpenedModalForName())
  this.companyName = this.listService.getCurrentCompanyName();
  }


calculator(){}

  // -------------------------------
  // FILTER
  // -------------------------------
  onFilterChange(event: any) {
    const input = event.target.value || '';
    this.filterValue = input;
    this.applyFilter(input);
    window.scrollTo(0, 0);
  }

  applyFilter(filter: string) {
    this.filteredList = this.listService.filterList(filter);
  }

  // -------------------------------
  // COUNTERS
  // -------------------------------
  increment(key: string) {
    const next = (this.currentList.value[key] ?? 0) + 1;
    this.listService.addToList(key, next);
  }

  decrement(key: string) {
    const next = Math.max(0, (this.currentList.value[key] ?? 0) - 1);
    this.listService.addToList(key, next);
  }

  // -------------------------------
  // SAVE & RESET
  // -------------------------------

  resetList() {
    this.listService.resetList();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
