import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListService } from '../../../core/services/load-calculator-services/load-calculator.service';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-add-name-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-name-modal.html',
  styleUrls: ['./add-name-modal.css'],
})
export class AddNameModal implements OnInit {
  name: string = '';
  title = 'Wpisz nazwę';

  constructor(
    private listService: ListService,
    private router: Router,
    private modalService: ModalService,
  ) {
    this.name = this.cleanName(this.listService.getCurrentCompanyName());
  }

  ngOnInit() {
    this.name = this.cleanName(this.listService.getCurrentCompanyName());
  }

  private cleanName(raw: string): string {
    return (raw || '').replace(/,\s*$/, '').replace(/\s*zaktualizowano\s*$/i, '').trim();
  }

  create() {
    try {
      const clean = (this.name || '').trim();
      if (!clean) return;
      this.listService.setCurrentCompanyName(clean);
      this.close();
    } catch (e) {
      console.error('Error setting company name:', e);
    }
  }

  close() {
    this.modalService.closeNameModal();
  }

  cancel() {
    const onCancel = this.modalService.onNameCancel;
    this.modalService.closeNameModal();
    if (onCancel) {
      onCancel();
    } else if (this.router.url.includes('/load-management/add') && !this.listService.getCurrentCompanyName()?.trim()) {
      this.listService.resetList();
      this.router.navigate(['/app/load-management/']);
    }
  }
}
