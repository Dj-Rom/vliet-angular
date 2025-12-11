import { Component, OnInit } from '@angular/core';
import {VehicleFleetService} from './vehicle-fleet.service';


@Component({
  selector: 'app-vehicle-fleet',
  templateUrl: './vehicle-fleet.html',
  styleUrls: ['./vehicle-fleet.css']
})
export class VehicleFleet implements OnInit {
  listVehicle: any[] = [];

  constructor(private vehicleFleetService: VehicleFleetService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.listVehicle = await this.vehicleFleetService.loadVehicleFleet();
      console.log(this.listVehicle);
    } catch (error) {
      console.error('Error fetching vehicle fleet:', error);
    }
  }
}
