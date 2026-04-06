export interface _VehicleFleet {
  id?: string;
  vehicle_number: string;
  type: 'truck' | 'trailer' | 'bus';
  brand: 'daf' | 'volvo' | 'iveco' | 'schmitz' | 'other';
}
export interface _WayBill {
  id?: string;
  dataStart: string;
  dataFinish: string;
  truck: string;
  trailer: string;
  tripTime?: string;
  billableDays?: number;
  notes?: string;
}

export interface _Vehicle {
  truck: string;
  trailer: string;
}

export interface _Date {
  dataStart: string;
  timeStart: string;
  dataFinish: string;
  timeFinish: string;
}
export interface DateRange {
  start: Date;
  end: Date;
}
export interface MonthDay {
  date: Date;
  holiday?: {
    id: string;
    name: string;
    // other properties
  };
}
