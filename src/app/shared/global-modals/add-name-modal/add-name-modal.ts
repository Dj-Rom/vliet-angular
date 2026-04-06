import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/load-calculator-services/load-calculator.service';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-add-name-modal',
  imports: [FormsModule],
  templateUrl: './add-name-modal.html',
  styleUrls: ['./add-name-modal.css'],
})
export class AddNameModal {
  name: any;
  title = 'Enter the name';

  constructor(
    private listService: ListService,
    private router: Router,
    private modalService: ModalService,
  ) {
    this.name = this.listService.getCurrentCompanyName();
  }

  create() {
    try {
      this.listService.setCurrentCompanyName(this.name);
      this.close();
    } catch (e) {
      alert('error');
    }
  }

  close() {
    this.modalService.closeNameModal();
  }

  cancel() {
    this.modalService.closeNameModal();
  }
}
