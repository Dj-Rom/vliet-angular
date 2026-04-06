import { Component, OnInit } from '@angular/core';
import { VehicleFleetService } from '../../core/services/vehicle-fleet.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-vehicle-fleet',
  templateUrl: './vehicle-fleet.html',
  styleUrls: ['./vehicle-fleet.css'],
})
export class VehicleFleet implements OnInit {
  listVehicle: any[] = [];

  constructor(
    private vehicleFleetService: VehicleFleetService,
    private alert: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.listVehicle = await this.vehicleFleetService.loadVehicleFleet();
    } catch (error) {
      this.alert.show('error', `Error fetching vehicle fleet:, ${error}`);
    }
  }
}
