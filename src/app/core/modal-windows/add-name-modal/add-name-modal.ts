import {Component, Input, } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ListService} from '../../../services/load-calculator-services/load-calculator-service';
import {Router} from '@angular/router';
import {AddNewList} from '../../load-calculator/add-new-list/add-new-list';

@Component({
  selector: 'app-add-name-modal',
  imports: [
    FormsModule
  ],
  templateUrl: './add-name-modal.html',
  styleUrl: './add-name-modal.css',
})
export class AddNameModal {
name: any;
  @Input() title!: string;
constructor(private listService: ListService, private router: Router, private addNewList: AddNewList) {
}

  create() {
   this.listService.setCurrentCompanyName(this.name)?this.close():alert('error');
  }
  close(){
this.addNewList.setIsOpenedModalForName();
  }

  cancel(){
  this.router.navigate(['/app/load-management/today']);
  }



}
