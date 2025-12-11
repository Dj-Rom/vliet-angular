import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgIf],
  templateUrl: './alert.html',
  styleUrls: ['./alert.css']
})
export class _Alert {
  isShow = false;
  message = '';
  type: 'error' | 'success' = 'error';

  constructor(private alertService: AlertService) {
    this.alertService.register(this);
  }

  setAlert(type: 'error' | 'success', message: string) {
    this.type = type;
    this.message = message;
    this.isShow = true;
    setTimeout(() => (this.isShow = false), 3000);
  }
}
