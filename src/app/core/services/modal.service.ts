import { Injectable, signal } from '@angular/core';
import { ListService } from './load-calculator-services/load-calculator.service';

@Injectable({ providedIn: 'root' })
export class ModalService {
  isNameModalOpen = signal(false);
  isSureModalOpen = signal(false);
  isAvailableCapacityModalOpen = signal(false);
  onConfirm: (() => void) | undefined;
  onCancel: (() => void) | undefined;

  constructor(private listService: ListService) {}
  changeBodyBackGroundAndScroll(isScroll: boolean) {}
  openNameModal(bool = true) {
    this.changeBodyBackGroundAndScroll(true);
    if (!!this.listService.getCurrentCompanyName() && bool) return;
    this.isNameModalOpen.set(true);
  }

  closeNameModal() {
    this.changeBodyBackGroundAndScroll(false);
    this.isNameModalOpen.set(false);
  }
  openSureModal(): Promise<boolean> {
    this.changeBodyBackGroundAndScroll(true);
    return new Promise((resolve) => {
      this.isSureModalOpen.set(true);

      this.onConfirm = () => {
        this.isSureModalOpen.set(false);
        resolve(true);
      };

      this.onCancel = () => {
        this.changeBodyBackGroundAndScroll(false);
        this.isSureModalOpen.set(false);
        resolve(false);
      };
    });
  }

  openAvailableCapacityModal(): void {
    this.isAvailableCapacityModalOpen.set(true);
    this.changeBodyBackGroundAndScroll(true);
  }
  closeAvailableCapacityModal() {
    this.changeBodyBackGroundAndScroll(false);
    this.isAvailableCapacityModalOpen.set(false);
  }
}
