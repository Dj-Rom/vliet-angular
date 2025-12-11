import { Injectable } from '@angular/core';
import { FirebaseClientService } from '../../firebase/firebase.service';

@Injectable({ providedIn: 'root' })
export class VehicleFleetService {
  private listVehicle: any[] = [];

  constructor(private firebase: FirebaseClientService) {}

  async loadVehicleFleet(): Promise<any[]> {
    this.listVehicle = await this.firebase.getVehicleFleet();
    return this.listVehicle;
  }

  async getVehicleFleet(): Promise<any[]> {
    await this.loadVehicleFleet()
    return this.listVehicle;
  }
}
