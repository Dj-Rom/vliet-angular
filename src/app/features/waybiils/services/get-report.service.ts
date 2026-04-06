import { Injectable } from '@angular/core';
import { _WayBill } from '../../../../interfaces';
import { formatForPDF } from '../../../helpers/formatDateTime';

@Injectable({ providedIn: 'root' })
export class ReportService {
  filterByRange(waybills: _WayBill[], rangeStart: Date, rangeFinish: Date): _WayBill[] {
    const start = new Date(rangeStart);
    const finish = new Date(rangeFinish);

    start.setHours(0, 0, 0, 0);
    finish.setHours(23, 59, 59, 999);

    return waybills.filter((w) => {
      const wbStart = new Date(w.dataStart);
      const wbFinish = w.dataFinish ? new Date(w.dataFinish) : wbStart;

      if (isNaN(wbStart.getTime()) || isNaN(wbFinish.getTime())) {
        return false;
      }

      return wbStart <= finish && wbFinish >= start;
    });
  }

  buildTableData(waybills: _WayBill[]) {
    return waybills.map((bill) => {
      const start = new Date(bill.dataStart);
      const finish = bill.dataFinish ? new Date(bill.dataFinish) : start;

      if (isNaN(start.getTime()) || isNaN(finish.getTime())) {
        return {
          id: bill.id,
          truck: bill.truck ?? '-',
          trailer: bill.trailer ?? '-',
          start: '-',
          finish: '-',
          billableDays: '-',
          tripTime: '-',
          notes: bill.notes ?? '',
        };
      }

      const diffHrs = (finish.getTime() - start.getTime()) / 3_600_000;

      let hours = Math.floor(diffHrs);
      let minutes = Math.round((diffHrs - hours) * 60);

      if (minutes === 60) {
        hours++;
        minutes = 0;
      }

      const tripTime = `${hours}h ${minutes}m`;

      const billableDays = diffHrs <= 12 ? 0.5 : diffHrs <= 24 ? 1 : Math.ceil(diffHrs / 12) * 0.5;

      return {
        id: bill.id,
        truck: bill.truck ?? '-',
        trailer: bill.trailer ?? '-',
        start: formatForPDF(bill.dataStart) ?? '-',
        finish: formatForPDF(bill.dataFinish) ?? '-',
        billableDays,
        tripTime,
        notes: bill.notes ?? '',
      };
    });
  }
}
