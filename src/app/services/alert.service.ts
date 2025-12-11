import { Injectable } from '@angular/core';
import {_Alert} from '../core/alert/alert';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private _alert?: _Alert;

  register(alert: _Alert) {
    this._alert = alert;
  }

  show(type: 'error' | 'success', message: string) {

    this._alert?.setAlert(type, message);
  }
}
