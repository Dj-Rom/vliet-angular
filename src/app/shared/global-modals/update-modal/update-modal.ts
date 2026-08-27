import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateService } from '../../../core/services/update.service';

@Component({
  selector: 'app-update-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-modal.html',
  styleUrls: ['./update-modal.css'],
})
export class UpdateModal {
  constructor(public updateService: UpdateService) {}

  updateNow(): void {
    this.updateService.applyUpdate();
  }

  later(): void {
    this.updateService.dismissUpdate();
  }
}
