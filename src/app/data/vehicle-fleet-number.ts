export interface _VehicleFleet {
id?: string;
  vehicle_number: string;
    type: 'truck'| 'trailer' | 'bus' ;
    brand: 'daf' | 'volvo'| 'iveco'| 'schmitz'| 'other'

}
export interface  _WillBill{
  id?: string;
  dataStart:  string;
  dataFinish: string;
  truck: string;
  trailer: string;
  tripTime?: string;
  billableDays?: number;
  notes?: string;
}


