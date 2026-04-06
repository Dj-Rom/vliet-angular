import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/load-calculator-services/load-calculator.service';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { MoreMenuService } from '../../../core/services/more-menu.service';

@Component({
  selector: 'app-are-your-sure-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './are-your-sure-modal.html',
  styleUrls: ['../add-name-modal/add-name-modal.css'],
})
export class AreYourSureModal {
  constructor(
    private listService: ListService,
    private router: Router,
    private modalService: ModalService,
    private moreMenuService: MoreMenuService,
  ) {}

  onSure() {
    if (this.modalService.onConfirm) {
      this.modalService.onConfirm();
    }
  }

  cancel() {
    if (this.modalService.onCancel) {
      this.modalService.onCancel();
    }
  }
}
