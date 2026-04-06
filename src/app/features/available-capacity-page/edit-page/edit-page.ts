import { Component } from '@angular/core';
import { AvailableCapacityService } from '../../../core/services/available-capacity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyValuePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { _Alert } from '../../../shared/alert/alert';

@Component({
  selector: 'app-edit-page',
  imports: [KeyValuePipe, FormsModule],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.css',
})
export class EditPage {
  data: any;
  type!: keyof AvailableCapacityService;

  constructor(
    protected availableCapacityService: AvailableCapacityService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private router: Router,
    private location: Location,
  ) {
    const key = this.route.snapshot.paramMap.get('key');
    if (!key) {
      this.router.navigate(['app/available-capacity']);
      return;
    }

    this.type = key.toUpperCase()! as keyof AvailableCapacityService;
    this.data = this.availableCapacityService.getTruck(this.type as any);
  }

  protected back() {
    this.location.back();
  }

  protected changeCapacity(item: any) {
    if (item.value < 0) item.value = 0;

    this.availableCapacityService.updateFromInput(this.type, item.key, item.value);
  }

  protected onKeyDown(event: KeyboardEvent, item: any) {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (allowedKeys.includes(event.key)) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const currentValue = item.value?.toString() ?? '';
    const nextValue = Number(currentValue + event.key);
    const max = this.data.canLoad[item.key];

    if (nextValue >= max) {
      this.alert.show('error', `Maksymalnie dla ${item.key}: ${max}`);
      event.preventDefault();
    }
  }

  protected onInput(item: any) {
    if (item.value == null) return;
    const valueStr = item.value.toString();
    if (valueStr.length > 1 && valueStr.startsWith('0')) {
      item.value = Number(valueStr);
    }

    this.changeCapacity(item);
  }
}
