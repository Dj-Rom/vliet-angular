import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="alertService.isShow()"
      [class]="
        alertService.getType() === 'error'
          ? 'error alert font400size16'
          : 'success alert font400size16'
      "
    >
      <!-- Conditional icon -->
      <img
        *ngIf="alertService.getType() === 'error'"
        src="assets/svg/error-message-logo.svg"
        alt="error logo"
      />
      <img
        *ngIf="alertService.getType() === 'success'"
        src="assets/svg/check.svg"
        alt="check mark"
      />

      <!-- Message -->
      {{ alertService.getMessage() }}

      <!-- Close button -->
      <svg
        (click)="alertService.hide()"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.33317 15.8333L4.1665 14.6666L8.83317 9.99996L4.1665 5.33329L5.33317 4.16663L9.99984 8.83329L14.6665 4.16663L15.8332 5.33329L11.1665 9.99996L15.8332
14.6666L14.6665 15.8333L9.99984 11.1666L5.33317 15.8333Z"
          fill="currentColor"
          stroke="currentColor"
        />
      </svg>
    </div>
  `,
  styleUrls: ['./alert.css'],
})
export class _Alert {
  constructor(public alertService: AlertService) {}
}
